<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let isRegister = false;
  let name = '';

  let clientId = '';
  let redirectUri = '';
  let state = '';
  let nonce = '';
  let scope = '';

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    clientId = params.get('client_id') || '';
    redirectUri = params.get('redirect_uri') || '';
    state = params.get('state') || '';
    nonce = params.get('nonce') || undefined;
    scope = params.get('scope') || '';
  });

  async function handleSubmit() {
    loading = true;
    error = '';

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { email, password, name }
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

      // Salvar userId e email no localStorage para uso no admin panel
      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', email);

      // Se tem parâmetros OAuth, ir para authorize
      if (clientId && redirectUri) {
        const authorizeUrl = `/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}${nonce ? `&nonce=${nonce}` : ''}`;
        window.location.href = authorizeUrl;
      } else {
        // Senão, redirecionar para home ou dashboard
        push('/');
      }

    } catch (err) {
      error = err.message;
      loading = false;
    }
  }

  function quickLogin(testEmail, testPassword) {
    email = testEmail;
    password = testPassword;
    handleSubmit();
  }

  function goToAdmin() {
    push('/admin/login');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-4 relative overflow-hidden">
  <!-- Elementos decorativos de fundo -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float"></div>
    <div class="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl animate-float" style="animation-delay: 1s"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s"></div>
  </div>

  <!-- Card de login -->
  <div class="relative z-10 w-full max-w-md">
    <div class="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-cyan-500/20">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/50">
          <span class="text-4xl">🎮</span>
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {isRegister ? 'Criar Conta' : 'Bem-vindo'}
        </h1>
        <p class="text-slate-400 text-sm">WorkCodeForge Authentication</p>
      </div>

      <!-- Botão Admin Panel -->
      <button
        on:click={goToAdmin}
        type="button"
        class="w-full mb-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
      >
        <span class="text-xl">⚡</span>
        <span>Acessar Painel Administrativo</span>
      </button>

      <!-- Toggle Login/Register -->
      <div class="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
        <button
          type="button"
          on:click={() => isRegister = false}
          class="flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 {!isRegister ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}"
        >
          Login
        </button>
        <button
          type="button"
          on:click={() => isRegister = true}
          class="flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 {isRegister ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}"
        >
          Cadastrar
        </button>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm animate-slide-up">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-5">
        {#if isRegister}
          <div>
            <label for="name" class="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <span class="text-lg">👤</span>
              Nome Completo
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder="Seu nome"
              required={isRegister}
              disabled={loading}
              class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        {/if}

        <div>
          <label for="email" class="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <span class="text-lg">📧</span>
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="[email protected]"
            required
            disabled={loading}
            class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label for="password" class="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
            <span class="text-lg">🔒</span>
            Senha
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            disabled={loading}
            class="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {#if loading}
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando...
            </span>
          {:else}
            {isRegister ? '✨ Criar Conta' : '🚀 Entrar'}
          {/if}
        </button>
      </form>

      <!-- Usuários de teste -->
      {#if !isRegister}
        <div class="mt-8 p-5 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl">
          <p class="text-center text-slate-400 text-sm mb-4 flex items-center justify-center gap-2">
            <span class="text-lg">💡</span>
            <span>Usuários de teste - Clique para login rápido</span>
          </p>

          <div class="space-y-2">
            <button
              type="button"
              on:click={() => quickLogin('admin@example.com', 'pwd')}
              disabled={loading}
              class="w-full p-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">👨‍💼</span>
                  <div class="text-left">
                    <div class="text-white font-medium text-sm">Admin User</div>
                    <code class="text-emerald-400 text-xs">admin@example.com</code>
                  </div>
                </div>
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">ADMIN</span>
              </div>
            </button>

            <button
              type="button"
              on:click={() => quickLogin('user@example.com', 'password')}
              disabled={loading}
              class="w-full p-3 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">👤</span>
                  <div class="text-left">
                    <div class="text-white font-medium text-sm">Regular User</div>
                    <code class="text-blue-400 text-xs">user@example.com</code>
                  </div>
                </div>
                <span class="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">USER</span>
              </div>
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <p class="text-center mt-6 text-slate-500 text-sm">
      Powered by <span class="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">WorkCodeForge</span>
    </p>
  </div>
</div>
