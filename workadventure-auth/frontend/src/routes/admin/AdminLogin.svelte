<script>
  import { push } from 'svelte-spa-router';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro na autenticação');
      }

      const { userId } = await response.json();

      // Salvar userId no localStorage
      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', email);

      // Redirecionar para o dashboard
      push('/admin');

    } catch (err) {
      error = err.message;
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gradient-gaming flex items-center justify-center p-4 relative overflow-hidden">
  <!-- Elementos decorativos de fundo -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
    <div class="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style="animation-delay: 1s"></div>
  </div>

  <!-- Card de login -->
  <div class="relative z-10 w-full max-w-md">
    <div class="glass-gaming rounded-2xl p-8 shadow-2xl border border-primary-500/30">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-gaming rounded-xl mb-4 animate-glow">
          <span class="text-3xl">⚡</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2 glow-text">Admin Panel</h1>
        <p class="text-white/60">WorkCodeForge Authentication</p>
      </div>

      {#if error}
        <div class="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm animate-slide-up">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      {/if}

      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <div>
          <label for="email" class="block text-sm font-medium text-white/80 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="[email protected]"
            required
            disabled={loading}
            class="input bg-dark-100/50 text-white placeholder-white/40 border-white/20 focus:border-primary-500"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-white/80 mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
            disabled={loading}
            class="input bg-dark-100/50 text-white placeholder-white/40 border-white/20 focus:border-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full btn-primary py-3 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Autenticando...' : '🔐 Entrar no Admin'}
        </button>
      </form>

      <div class="mt-8 p-4 glass rounded-lg">
        <p class="text-center text-white/60 text-sm mb-2">
          💡 Credenciais de teste
        </p>
        <div class="text-center">
          <code class="text-primary-300 text-sm">admin@example.com</code>
          <span class="text-white/40 mx-2">/</span>
          <code class="text-primary-300 text-sm">pwd</code>
        </div>
        <p class="text-center text-xs text-white/40 mt-2">
          ⚠️ Senha case-sensitive (tudo minúscula)
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p class="text-center mt-6 text-white/40 text-sm">
      Powered by <span class="text-gradient font-semibold">WorkCodeForge</span>
    </p>
  </div>
</div>
