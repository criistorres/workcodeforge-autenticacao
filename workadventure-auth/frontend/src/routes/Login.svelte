<script>
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let isRegister = false;
  let name = '';
  let defaultMap = 'main';

  let clientId = '';
  let redirectUri = '';
  let state = '';
  let nonce = '';
  let scope = '';

  // OAuth Redirect URI configuration from environment
  const REDIRECT_URI_CONFIG = {
    play: import.meta.env.VITE_PLAY_REDIRECT_URI || '',
    matrix: import.meta.env.VITE_MATRIX_REDIRECT_URI || '',
  };

  function getServiceFromRedirectUri(uri) {
    if (!uri) return 'unknown';

    for (const [service, configuredUri] of Object.entries(REDIRECT_URI_CONFIG)) {
      if (configuredUri && uri === configuredUri) {
        return service;
      }
    }

    try {
      const url = new URL(uri);
      const path = url.pathname;

      if (path === '/openid-callback' || path.startsWith('/app')) {
        return 'play';
      }
      if (path.includes('/_synapse/client/oidc/callback')) {
        return 'matrix';
      }
    } catch (e) {
      console.warn('[LOGIN] Could not parse redirect_uri:', uri);
    }

    return 'unknown';
  }

  function getOAuthStates() {
    try {
      const stored = localStorage.getItem('oauthStates');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('[LOGIN] Error parsing OAuth states:', e);
      return {};
    }
  }

  function setOAuthStates(states) {
    try {
      localStorage.setItem('oauthStates', JSON.stringify(states));
    } catch (e) {
      console.error('[LOGIN] Error saving OAuth states:', e);
    }
  }

  function updateParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    clientId = params.get('client_id') || '';
    redirectUri = params.get('redirect_uri') || '';
    state = params.get('state') || '';
    nonce = params.get('nonce') || undefined;
    scope = params.get('scope') || '';

    const isLogout = params.get('logout') === 'true' || params.get('post_logout_redirect_uri');
    if (isLogout) {
      console.log('[LOGIN] Logout detectado, limpando sessão...');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionEmail');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('lastOAuthState');
      localStorage.removeItem('oauthStates');

      const logoutTimestamp = Date.now();
      localStorage.setItem('justLoggedOut', logoutTimestamp.toString());
      console.log('[LOGIN] Flag de logout recente marcada:', logoutTimestamp);

      const postLogoutRedirect = params.get('post_logout_redirect_uri');
      if (postLogoutRedirect) {
        console.log('[LOGIN] Redirecionando após logout para:', postLogoutRedirect);
        window.location.href = postLogoutRedirect;
        return;
      }
    }

    console.log('[LOGIN] Parâmetros atualizados:', { clientId, redirectUri, state, scope, isLogout });
  }

  async function checkAndAutoAuthorize() {
    const params = new URLSearchParams(window.location.search);
    const isLogout = params.get('logout') === 'true' || params.get('post_logout_redirect_uri');

    if (isLogout) {
      console.log('[LOGIN] É um logout, pulando auto-authorize');
      return false;
    }

    const justLoggedOut = localStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      const logoutTime = parseInt(justLoggedOut);
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;

      if (now - logoutTime < twoMinutes) {
        console.log('[LOGIN] ⚠️ Logout recente detectado');
        return false;
      } else {
        console.log('[LOGIN] Flag de logout expirado, limpando...');
        localStorage.removeItem('justLoggedOut');
      }
    }

    const existingUserId = localStorage.getItem('userId');
    const sessionEmail = localStorage.getItem('sessionEmail');
    const oauthStates = getOAuthStates();

    const currentService = getServiceFromRedirectUri(redirectUri);
    const previousStateForService = oauthStates[currentService];

    console.log('[LOGIN] Auto-check sessão:', {
      existingUserId,
      sessionEmail,
      clientId,
      redirectUri,
      state,
      currentService,
      previousStateForService,
      allStates: oauthStates
    });

    if (state && previousStateForService && state !== previousStateForService) {
      console.log(`[LOGIN] ⚠️ State mudou para ${currentService}!`);
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionEmail');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('oauthStates');
      localStorage.setItem('oauthStates', JSON.stringify({ [currentService]: state }));
      return false;
    }

    if (state && currentService !== 'unknown') {
      console.log(`[LOGIN] Salvando state para serviço '${currentService}'`);
      oauthStates[currentService] = state;
      setOAuthStates(oauthStates);
    }

    if (existingUserId && sessionEmail && clientId && redirectUri) {
      console.log('[LOGIN] Sessão válida encontrada, fazendo auto-authorize...');

      try {
        const authResponse = await fetch('/auth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: existingUserId,
            clientId,
            redirectUri,
            scope,
            state,
            nonce
          })
        });

        if (authResponse.ok) {
          const { code } = await authResponse.json();
          console.log('[LOGIN] Auto-authorize bem-sucedido, redirecionando...');
          window.location.href = `${redirectUri}?code=${code}&state=${state}`;
          return true;
        }
      } catch (err) {
        console.log('[LOGIN] Erro no auto-authorize:', err);
      }
    }
    return false;
  }

  onMount(async () => {
    console.log('[LOGIN] ========== PÁGINA CARREGADA ==========');
    console.log('[LOGIN] URL completa:', window.location.href);
    console.log('[LOGIN] localStorage antes:', {
      userId: localStorage.getItem('userId'),
      sessionEmail: localStorage.getItem('sessionEmail')
    });

    updateParamsFromUrl();

    if (!clientId && !redirectUri) {
      console.log('[LOGIN] ⚠️ Acesso direto sem parâmetros OAuth - LIMPANDO SESSÃO');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionEmail');
      localStorage.removeItem('userEmail');
      console.log('[LOGIN] localStorage depois da limpeza:', {
        userId: localStorage.getItem('userId'),
        sessionEmail: localStorage.getItem('sessionEmail')
      });
    } else {
      console.log('[LOGIN] ✓ Parâmetros OAuth presentes:', { clientId, redirectUri });
    }

    setTimeout(async () => {
      await checkAndAutoAuthorize();
    }, 100);

    const handleUrlChange = async () => {
      updateParamsFromUrl();
      setTimeout(async () => {
        await checkAndAutoAuthorize();
      }, 100);
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  });

  function fillLoginForm(userEmail, userPassword) {
    email = userEmail;
    password = userPassword;
  }

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      const existingUserId = localStorage.getItem('userId');
      const sessionEmail = localStorage.getItem('sessionEmail');

      console.log('[LOGIN] Email atual:', email);
      console.log('[LOGIN] Sessão existente:', { existingUserId, sessionEmail });
      console.log('[LOGIN] Parâmetros OAuth:', { clientId, redirectUri, state, scope });

      if (existingUserId && sessionEmail === email) {
        console.log('[LOGIN] Sessão válida encontrada, pulando login...');

        const authResponse = await fetch('/auth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: existingUserId,
            clientId,
            redirectUri,
            scope,
            state,
            nonce
          })
        });

        if (authResponse.ok) {
          const { code } = await authResponse.json();
          console.log('[LOGIN] Código de autorização gerado, redirecionando...');
          window.location.href = `${redirectUri}?code=${code}&state=${state}`;
          return;
        }
      }

      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { email, password, name, defaultMap }
        : { email, password };

      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro na autenticação');
      }

      const { userId } = await response.json();

      localStorage.setItem('userId', userId);
      localStorage.setItem('sessionEmail', email);
      localStorage.removeItem('justLoggedOut');
      console.log('[LOGIN] Login bem-sucedido, userId:', userId);

      const authResponse = await fetch('/auth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clientId,
          redirectUri,
          scope,
          state,
          nonce
        })
      });

      const { code } = await authResponse.json();
      console.log('[LOGIN] Código gerado, redirecionando para:', redirectUri);

      window.location.href = `${redirectUri}?code=${code}&state=${state}`;

    } catch (err) {
      error = err.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #1B1B29;
      min-height: 100vh;
      overflow: hidden;
    }

    :global(html) {
      --contrast: 43, 39, 59;
      --secondary: 86, 234, 255;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes bobbing {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }

    .character {
      animation: bobbing 3s ease-in-out infinite;
    }

    .modal-content {
      animation: slideUp 0.4s ease-out;
    }
  </style>
</svelte:head>

<!-- Main backdrop -->
<div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
  <!-- Subtle background pattern -->
  <div class="absolute inset-0 opacity-10">
    <svg class="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(86, 234, 255, 0.3)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" />
    </svg>
  </div>

  <!-- Admin access button -->
  <a
    href="#/admin/login"
    class="absolute top-4 right-4 z-20 p-3 bg-contrast/60 hover:bg-contrast/80 border border-secondary/30 rounded-md text-secondary transition-all duration-200 md:top-8 md:right-8"
    title="Acessar painel administrativo"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  </a>

  <!-- Character - WorkAdventure pixel art -->
  <div class="character absolute bottom-10 right-10 md:right-20 md:bottom-20 pointer-events-none z-5">
    <img
      src="/yoda-avatar.png"
      alt="Guia do jogo"
      class="w-24 h-24 md:w-32 md:h-32"
      style="filter: drop-shadow(0 8px 20px rgba(86, 234, 255, 0.35)); image-rendering: pixelated;"
    />
    <!-- Speech bubble -->
    <div class="absolute -top-14 right-0 bg-contrast/90 border border-secondary/60 rounded-md px-3 py-1.5 text-xs text-white backdrop-blur-md pointer-events-auto whitespace-nowrap shadow-lg" style="background: rgba(43, 39, 59, 0.9); border-color: rgba(86, 234, 255, 0.6);">
      Bem-vindo!
      <div class="absolute top-full right-4 w-2 h-2 bg-contrast" style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%); background: rgba(43, 39, 59, 0.9);"></div>
    </div>
  </div>

  <!-- Login card -->
  <div class="relative w-full max-w-sm z-10">
    <div class="modal-content bg-contrast/80 rounded-lg border border-secondary/25 p-8 backdrop-blur-lg shadow-2xl" style="background-color: rgba(43, 39, 59, 0.8); border-color: rgba(86, 234, 255, 0.25);">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-1">
          {isRegister ? 'Criar Conta' : 'Entrar'}
        </h1>
        <p class="text-secondary text-xs font-semibold uppercase tracking-wider">WorkCodeForge</p>
      </div>

      <!-- Error message -->
      {#if error}
        <div class="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 text-sm">
          {error}
        </div>
      {/if}

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-5">
        {#if isRegister}
          <div>
            <label for="name" class="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
              Nome
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder="Seu nome completo"
              required
              disabled={loading}
              class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label for="defaultMap" class="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
              Mapa Padrão
            </label>
            <select
              id="defaultMap"
              bind:value={defaultMap}
              disabled={loading}
              class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 disabled:opacity-50 appearance-none cursor-pointer"
            >
              <option value="main">Principal (main)</option>
              <option value="filial1">Filial 1</option>
              <option value="filial2">Filial 2</option>
              <option value="sede">Sede</option>
            </select>
          </div>
        {/if}

        <div>
          <label for="email" class="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="seu@email.com"
            required
            disabled={loading}
            class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
            Senha
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            disabled={loading}
            class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-2.5 px-4 bg-secondary text-contrast font-bold rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all duration-200 disabled:opacity-50 mt-6"
        >
          {#if loading}
            <span class="flex items-center justify-center gap-2 text-sm">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </span>
          {:else}
            {isRegister ? 'Criar Conta' : 'Entrar'}
          {/if}
        </button>
      </form>

      <!-- Toggle -->
      <div class="mt-6 text-center">
        <button
          type="button"
          on:click={() => isRegister = !isRegister}
          disabled={loading}
          class="text-secondary hover:text-secondary/80 text-sm font-semibold transition-colors duration-200 disabled:opacity-50"
        >
          {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Registrar'}
        </button>
      </div>

      <!-- Test users section -->
      <div class="mt-8 pt-6 border-t border-white/10">
        <h3 class="text-xs font-bold text-secondary uppercase tracking-wider mb-4">
          Usuários de Teste
        </h3>
        <div class="space-y-2">
          <button
            type="button"
            on:click={() => fillLoginForm('admin@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-all duration-200 disabled:opacity-50 text-xs"
          >
            <p class="text-blue-300 font-semibold">admin@example.com</p>
            <p class="text-white/60 text-xs">👑 admin, moderator</p>
          </button>

          <button
            type="button"
            on:click={() => fillLoginForm('user1@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-md transition-all duration-200 disabled:opacity-50 text-xs"
          >
            <p class="text-purple-300 font-semibold">user1@example.com</p>
            <p class="text-white/60 text-xs">👤 admin, moderator</p>
          </button>

          <button
            type="button"
            on:click={() => fillLoginForm('user2@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-all duration-200 disabled:opacity-50 text-xs"
          >
            <p class="text-green-300 font-semibold">user2@example.com</p>
            <p class="text-white/60 text-xs">👥 member</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
