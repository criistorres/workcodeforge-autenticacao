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

      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('isAdmin', 'true');

      push('/admin');

    } catch (err) {
      error = err.message;
      loading = false;
    }
  }

  function goBack() {
    push('/');
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

  <!-- Back button -->
  <button
    on:click={goBack}
    class="absolute top-4 left-4 z-20 p-3 bg-contrast/60 hover:bg-contrast/80 border border-secondary/30 rounded-md text-secondary transition-all duration-200 md:top-8 md:left-8"
    title="Voltar ao login regular"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
    </svg>
  </button>

  <!-- Admin card -->
  <div class="relative w-full max-w-sm z-10">
    <div class="modal-content bg-contrast/80 rounded-lg border border-secondary/25 p-8 backdrop-blur-lg shadow-2xl" style="background-color: rgba(43, 39, 59, 0.8); border-color: rgba(86, 234, 255, 0.25);">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="text-4xl mb-3">⚡</div>
        <h1 class="text-3xl font-bold text-white mb-1">
          Admin Panel
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
      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <div>
          <label for="email" class="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="admin@example.com"
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
              Autenticando...
            </span>
          {:else}
            🔐 Entrar no Admin
          {/if}
        </button>
      </form>

      <!-- Test credentials -->
      <div class="mt-8 pt-6 border-t border-white/10">
        <h3 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
          Credenciais de Teste
        </h3>
        <div class="text-xs text-white/70 space-y-1">
          <p><span class="text-secondary font-semibold">Email:</span> admin@example.com</p>
          <p><span class="text-secondary font-semibold">Senha:</span> pwd</p>
          <p class="text-white/50 mt-2">⚠️ Senha é case-sensitive (tudo minúscula)</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <p class="text-center mt-6 text-white/40 text-xs">
      Powered by <span class="text-secondary font-semibold">WorkCodeForge</span>
    </p>
  </div>
</div>
