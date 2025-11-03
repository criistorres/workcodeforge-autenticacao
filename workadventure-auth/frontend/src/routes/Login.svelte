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
      min-height: 100vh;
      overflow: hidden;
    }
  </style>
</svelte:head>

<!-- Admin access button - Pixel style (positioned outside flex container) -->
<a
  href="#/admin/login"
  class="fixed top-6 right-6 z-50 px-4 py-3 pixel-button bg-[#0f3460] hover:bg-[#16213e] text-[#5ce1e6] transition-all duration-100"
  title="Acessar painel administrativo"
  style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; position: fixed !important;"
>
  ⚡ ADMIN
</a>

<!-- Main backdrop with pixel grid -->
<div class="fixed inset-0 flex items-center justify-center p-4 pixel-grid pixel-theme">
  <!-- Scanline effect -->
  <div class="pixel-scanline"></div>

  <!-- Character - WorkAdventure pixel art -->
  <div class="pixel-bounce absolute bottom-10 right-10 md:right-20 md:bottom-20 pointer-events-none z-5" style="filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.5));">
    <img
      src="/yoda-avatar.png"
      alt="Guia do jogo"
      class="w-32 h-32 md:w-40 md:h-40"
      style="image-rendering: pixelated; filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.5));"
    />
    <!-- Speech bubble - Pixel style -->
    <div class="absolute -top-16 right-0 px-4 py-2 pointer-events-auto whitespace-nowrap" style="background: #16213e; border: 4px solid #0f3460; box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3); font-size: 8px; color: #5ce1e6;">
      BEM-VINDO!
      <div class="absolute top-full right-8 w-0 h-0" style="border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #0f3460;"></div>
    </div>
  </div>

  <!-- Login card - Pixel style terminal -->
  <div class="relative w-full max-w-md z-10">
    <!-- Glow effect -->
    <div class="absolute inset-0 pixel-pulse" style="z-index: -1; border: 4px solid var(--pixel-border);"></div>

    <div class="pixel-slide-in pixel-card p-8">
      <!-- Header - Terminal style -->
      <div class="text-center mb-8 pb-6" style="border-bottom: 3px dashed #0f3460;">
        <div class="mb-4 text-[#5ce1e6]" style="font-size: 8px; letter-spacing: 2px;">
          ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
        </div>
        <h1 class="text-white mb-3" style="font-size: 20px; text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(92, 225, 230, 0.5);">
          {isRegister ? 'CRIAR CONTA' : 'LOGIN'}
        </h1>
        <p class="text-[#53a8b6]" style="font-size: 8px; letter-spacing: 3px;">
          ★ WORKCODEFORGE ★
        </p>
      </div>

      <!-- Error message - Pixel style -->
      {#if error}
        <div class="mb-6 p-4" style="background: #2d1b1b; border: 3px solid #8b3a3a; box-shadow: inset 0 4px 0 rgba(0, 0, 0, 0.3); font-size: 8px; color: #ff6b6b;">
          ⚠ {error.toUpperCase()}
        </div>
      {/if}

      <!-- Form - Pixel style -->
      <form on:submit|preventDefault={handleSubmit} class="space-y-5">
        {#if isRegister}
          <div>
            <label for="name" class="block mb-2 text-[#53a8b6]" style="font-size: 8px; letter-spacing: 1px;">
              ► NOME
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder="SEU NOME"
              required
              disabled={loading}
              class="w-full px-4 py-3 pixel-input text-white placeholder-[#0f3460] disabled:opacity-50"
              style="background: #0a0e1a; color: #5ce1e6;"
            />
          </div>

          <div>
            <label for="defaultMap" class="block mb-2 text-[#53a8b6]" style="font-size: 8px; letter-spacing: 1px;">
              ► MAPA PADRÃO
            </label>
            <select
              id="defaultMap"
              bind:value={defaultMap}
              disabled={loading}
              class="w-full px-4 py-3 pixel-input text-white disabled:opacity-50 cursor-pointer appearance-none"
              style="background: #0a0e1a; color: #5ce1e6;"
            >
              <option value="main">PRINCIPAL (MAIN)</option>
              <option value="filial1">FILIAL 1</option>
              <option value="filial2">FILIAL 2</option>
              <option value="sede">SEDE</option>
            </select>
          </div>
        {/if}

        <div>
          <label for="email" class="block mb-2 text-[#53a8b6]" style="font-size: 8px; letter-spacing: 1px;">
            ► EMAIL
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="SEU@EMAIL.COM"
            required
            disabled={loading}
            class="w-full px-4 py-3 pixel-input text-white placeholder-[#0f3460] disabled:opacity-50"
            style="background: #0a0e1a; color: #5ce1e6;"
          />
        </div>

        <div>
          <label for="password" class="block mb-2 text-[#53a8b6]" style="font-size: 8px; letter-spacing: 1px;">
            ► SENHA
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            disabled={loading}
            class="w-full px-4 py-3 pixel-input text-white placeholder-[#0f3460] disabled:opacity-50"
            style="background: #0a0e1a; color: #5ce1e6;"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-4 px-4 pixel-button text-[#1a1a2e] font-bold disabled:opacity-50 mt-6"
          style="background: #5ce1e6; font-size: 12px; letter-spacing: 2px;"
        >
          {#if loading}
            <span class="flex items-center justify-center gap-2">
              ⏳ PROCESSANDO...
            </span>
          {:else}
            ▶ {isRegister ? 'CRIAR CONTA' : 'ENTRAR'} ◀
          {/if}
        </button>
      </form>

      <!-- Toggle - Pixel style -->
      <div class="mt-6 text-center pt-4" style="border-top: 2px dashed #0f3460;">
        <button
          type="button"
          on:click={() => isRegister = !isRegister}
          disabled={loading}
          class="text-[#5ce1e6] hover:text-[#53a8b6] disabled:opacity-50 transition-colors duration-100"
          style="font-size: 8px; letter-spacing: 1px;"
        >
          {isRegister ? '◄ JÁ TEM CONTA? ENTRAR' : '► NÃO TEM CONTA? REGISTRAR'}
        </button>
      </div>

      <!-- Test users section - Pixel style -->
      <div class="mt-8 pt-6" style="border-top: 3px dashed #0f3460;">
        <h3 class="text-[#5ce1e6] mb-4 text-center" style="font-size: 8px; letter-spacing: 2px;">
          ═══ USUÁRIOS DE TESTE ═══
        </h3>
        <div class="space-y-3">
          <button
            type="button"
            on:click={() => fillLoginForm('admin@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-4 py-3 pixel-button disabled:opacity-50"
            style="background: #1a2332; border-color: #2d5a8a; font-size: 8px;"
          >
            <p class="text-[#5ce1e6] mb-1" style="letter-spacing: 1px;">ADMIN@EXAMPLE.COM</p>
            <p class="text-[#53a8b6]">👑 ADMIN, MODERATOR</p>
          </button>

          <button
            type="button"
            on:click={() => fillLoginForm('user1@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-4 py-3 pixel-button disabled:opacity-50"
            style="background: #2a1a32; border-color: #5a2d8a; font-size: 8px;"
          >
            <p class="text-[#d8a7ff] mb-1" style="letter-spacing: 1px;">USER1@EXAMPLE.COM</p>
            <p class="text-[#9d7ab8]">👤 ADMIN, MODERATOR</p>
          </button>

          <button
            type="button"
            on:click={() => fillLoginForm('user2@example.com', 'pwd')}
            disabled={loading}
            class="w-full text-left px-4 py-3 pixel-button disabled:opacity-50"
            style="background: #1a321a; border-color: #2d8a2d; font-size: 8px;"
          >
            <p class="text-[#7bff7b] mb-1" style="letter-spacing: 1px;">USER2@EXAMPLE.COM</p>
            <p class="text-[#5ab85a]">👥 MEMBER</p>
          </button>
        </div>
      </div>

      <!-- Footer decoration -->
      <div class="mt-6 text-center text-[#0f3460]" style="font-size: 6px; letter-spacing: 2px;">
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      </div>
    </div>
  </div>
</div>
