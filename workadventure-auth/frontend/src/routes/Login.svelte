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
  // These should be set in .env file and passed to frontend
  // Example:
  //   PLAY_REDIRECT_URI=http://play.workadventure.localhost/openid-callback
  //   MATRIX_REDIRECT_URI=http://matrix.workadventure.localhost/_synapse/client/oidc/callback
  const REDIRECT_URI_CONFIG = {
    play: import.meta.env.VITE_PLAY_REDIRECT_URI || '',
    matrix: import.meta.env.VITE_MATRIX_REDIRECT_URI || '',
  };

  /**
   * Identify which service (play, matrix, etc) is requesting OAuth based on redirect_uri
   * This is used to track multiple OAuth states simultaneously for SSO support
   *
   * @param {string} uri - The redirect_uri from the OAuth request
   * @returns {string} - The service name (play, matrix, unknown)
   */
  function getServiceFromRedirectUri(uri) {
    if (!uri) return 'unknown';

    // Check against configured redirect URIs
    for (const [service, configuredUri] of Object.entries(REDIRECT_URI_CONFIG)) {
      if (configuredUri && uri === configuredUri) {
        return service;
      }
    }

    // Fallback: try to identify by path patterns
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

  /**
   * Get all tracked OAuth states from localStorage
   * @returns {Object} - Object mapping service names to their states
   */
  function getOAuthStates() {
    try {
      const stored = localStorage.getItem('oauthStates');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('[LOGIN] Error parsing OAuth states:', e);
      return {};
    }
  }

  /**
   * Save OAuth states to localStorage
   * @param {Object} states - Object mapping service names to their states
   */
  function setOAuthStates(states) {
    try {
      localStorage.setItem('oauthStates', JSON.stringify(states));
    } catch (e) {
      console.error('[LOGIN] Error saving OAuth states:', e);
    }
  }

  // Função para atualizar os parâmetros da URL
  function updateParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    clientId = params.get('client_id') || '';
    redirectUri = params.get('redirect_uri') || '';
    state = params.get('state') || '';
    nonce = params.get('nonce') || undefined;
    scope = params.get('scope') || '';

    // Verificar se é um logout
    const isLogout = params.get('logout') === 'true' || params.get('post_logout_redirect_uri');
    if (isLogout) {
      console.log('[LOGIN] Logout detectado, limpando sessão...');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionEmail');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('lastOAuthState'); // Legacy, keep for backwards compatibility
      localStorage.removeItem('oauthStates'); // Clear all service states for SSO

      // Marcar que acabou de fazer logout (válido por 2 minutos)
      const logoutTimestamp = Date.now();
      localStorage.setItem('justLoggedOut', logoutTimestamp.toString());
      console.log('[LOGIN] Flag de logout recente marcada:', logoutTimestamp);

      // Se tem redirect de logout, redirecionar
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
    // Verificar se é um logout - se for, NÃO fazer auto-authorize
    const params = new URLSearchParams(window.location.search);
    const isLogout = params.get('logout') === 'true' || params.get('post_logout_redirect_uri');

    if (isLogout) {
      console.log('[LOGIN] É um logout, pulando auto-authorize');
      return false;
    }

    // Verificar se acabou de fazer logout recentemente (últimos 2 minutos)
    const justLoggedOut = localStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      const logoutTime = parseInt(justLoggedOut);
      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;

      if (now - logoutTime < twoMinutes) {
        console.log('[LOGIN] ⚠️ Logout recente detectado (há', Math.round((now - logoutTime) / 1000), 'segundos) - NÃO fazer auto-authorize');
        return false;
      } else {
        // Passou de 2 minutos, limpar o flag
        console.log('[LOGIN] Flag de logout expirado, limpando...');
        localStorage.removeItem('justLoggedOut');
      }
    }

    const existingUserId = localStorage.getItem('userId');
    const sessionEmail = localStorage.getItem('sessionEmail');
    const oauthStates = getOAuthStates();

    // Identify which service is requesting OAuth
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

    // ✅ FIX: Only clear session if the SAME service is changing its state
    // This allows multiple services to authenticate simultaneously for SSO
    if (state && previousStateForService && state !== previousStateForService) {
      console.log(`[LOGIN] ⚠️ State mudou para ${currentService}! NOVO fluxo OAuth do mesmo serviço - LIMPANDO SESSÃO`);
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionEmail');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('oauthStates');
      localStorage.setItem('oauthStates', JSON.stringify({ [currentService]: state }));
      return false;
    }

    // ✅ NEW: Save state for this service (allows tracking multiple services)
    if (state && currentService !== 'unknown') {
      console.log(`[LOGIN] Salvando state para serviço '${currentService}'`);
      oauthStates[currentService] = state;
      setOAuthStates(oauthStates);
    }

    // Se já está autenticado e temos os parâmetros OAuth, fazer auto-authorize
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

    // Se não tem parâmetros OAuth (client_id vazio), assumir que é um acesso direto
    // (provavelmente após logout) e limpar a sessão
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

    // Aguardar um pouco para os parâmetros serem definidos
    setTimeout(async () => {
      await checkAndAutoAuthorize();
    }, 100);

    // Atualizar parâmetros quando a URL mudar (popstate/pushstate)
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
      // Verificar se já temos uma sessão ativa
      const existingUserId = localStorage.getItem('userId');
      const sessionEmail = localStorage.getItem('sessionEmail');

      console.log('[LOGIN] Email atual:', email);
      console.log('[LOGIN] Sessão existente:', { existingUserId, sessionEmail });
      console.log('[LOGIN] Parâmetros OAuth:', { clientId, redirectUri, state, scope });

      // Se já está autenticado com o mesmo email, pular login e ir direto para authorize
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

      // Fazer login normal
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

      // Salvar userId e email na sessão
      localStorage.setItem('userId', userId);
      localStorage.setItem('sessionEmail', email);
      // Remover flag de logout recente após login bem-sucedido
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
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
      min-height: 100vh;
    }
  </style>
</svelte:head>

<div class="flex items-center justify-center min-h-screen p-8">
  <!-- Efeitos de fundo -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
  </div>

  <div class="relative w-full max-w-md">
    <!-- Container principal - Estilo Gamer -->
    <div class="group relative">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

      <!-- Card principal -->
      <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-cyan-500/50 shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {isRegister ? '📝 Registrar' : '🔐 Entrar'}
          </h1>
          <p class="text-gray-400">WorkCodeForge Authentication</p>
        </div>

        <!-- Error message -->
        {#if error}
          <div class="mb-6 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/50 rounded-xl p-4 text-red-200">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="font-semibold text-sm">{error}</span>
            </div>
          </div>
        {/if}

        <!-- Form -->
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          {#if isRegister}
            <div class="space-y-2">
              <label for="name" class="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Nome
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-xl">👤</span>
                </div>
                <input
                  id="name"
                  type="text"
                  bind:value={name}
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                  class="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label for="defaultMap" class="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Mapa Padrão
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 text-xl">🗺️</span>
                </div>
                <select
                  id="defaultMap"
                  bind:value={defaultMap}
                  disabled={loading}
                  class="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="main">Principal (main)</option>
                  <option value="filial1">Filial 1</option>
                  <option value="filial2">Filial 2</option>
                  <option value="sede">Sede</option>
                </select>
              </div>
            </div>
          {/if}

          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 text-xl">📧</span>
              </div>
              <input
                id="email"
                type="email"
                bind:value={email}
                placeholder="[email protected]"
                required
                disabled={loading}
                class="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Senha
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 text-xl">🔑</span>
              </div>
              <input
                id="password"
                type="password"
                bind:value={password}
                placeholder="••••••••"
                required
                disabled={loading}
                class="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transform hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-cyan-500/50"
          >
            {#if loading}
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            {:else}
              {isRegister ? '📝 Criar Conta' : '🔐 Entrar'}
            {/if}
          </button>
        </form>

        <!-- Toggle -->
        <div class="mt-6 text-center">
          <button
            type="button"
            on:click={() => isRegister = !isRegister}
            disabled={loading}
            class="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegister ? '← Já tem conta? Entrar' : 'Não tem conta? Registrar →'}
          </button>
        </div>

        <!-- Info box - Usuários de teste -->
        <div class="mt-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 class="text-sm font-bold text-purple-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="text-xl">👤</span>
            Usuários de Teste
          </h3>
          <div class="space-y-3 text-xs">
            <div class="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="text-gray-300 mb-1">
                    <span class="text-cyan-400 font-semibold">Email:</span> admin@example.com
                  </p>
                  <p class="text-gray-300 mb-1">
                    <span class="text-purple-400 font-semibold">Senha:</span> pwd
                  </p>
                  <p class="text-gray-400">
                    <span class="text-green-400 font-semibold">Tags:</span> admin, moderator
                  </p>
                </div>
                <button
                  type="button"
                  on:click={() => fillLoginForm('admin@example.com', 'pwd')}
                  disabled={loading}
                  class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  Usar
                </button>
              </div>
            </div>
            <div class="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="text-gray-300 mb-1">
                    <span class="text-cyan-400 font-semibold">Email:</span> user1@example.com
                  </p>
                  <p class="text-gray-300 mb-1">
                    <span class="text-purple-400 font-semibold">Senha:</span> pwd
                  </p>
                  <p class="text-gray-400">
                    <span class="text-green-400 font-semibold">Tags:</span> admin, moderator
                  </p>
                </div>
                <button
                  type="button"
                  on:click={() => fillLoginForm('user1@example.com', 'pwd')}
                  disabled={loading}
                  class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  Usar
                </button>
              </div>
            </div>
            <div class="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="text-gray-300 mb-1">
                    <span class="text-cyan-400 font-semibold">Email:</span> user2@example.com
                  </p>
                  <p class="text-gray-300 mb-1">
                    <span class="text-purple-400 font-semibold">Senha:</span> pwd
                  </p>
                  <p class="text-gray-400">
                    <span class="text-green-400 font-semibold">Tags:</span> member
                  </p>
                </div>
                <button
                  type="button"
                  on:click={() => fillLoginForm('user2@example.com', 'pwd')}
                  disabled={loading}
                  class="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  Usar
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-700">
            <p class="text-gray-400 text-xs flex items-start gap-2">
              <span class="text-base">💡</span>
              <span>Clique em "Usar" para preencher automaticamente o formulário</span>
            </p>
            <p class="text-red-300 text-xs flex items-start gap-2 mt-2">
              <span class="text-base">⚠️</span>
              <span>A senha é <code class="px-1.5 py-0.5 bg-gray-900 rounded text-red-400">pwd</code> (tudo minúscula!)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
