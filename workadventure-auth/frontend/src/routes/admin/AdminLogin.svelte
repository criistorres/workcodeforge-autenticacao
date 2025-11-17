<script>
  import { push } from 'svelte-spa-router';
  import { userStore } from '../../stores/userStore';

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

      const userData = await response.json();

      // Armazenar dados do usuário no userStore
      userStore.setUser(userData);

      // Redirecionar para o dashboard
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
      min-height: 100vh;
      overflow: hidden;
    }
  </style>
</svelte:head>

<!-- Back button - Pixel style (positioned outside flex container) -->
<button
  on:click={goBack}
  class="fixed top-6 left-6 z-50 px-4 py-3 pixel-button bg-[#0f3460] hover:bg-[#16213e] text-[#5ce1e6] transition-all duration-100"
  title="Voltar ao login regular"
  style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; position: fixed !important;"
>
  ◄ VOLTAR
</button>

<!-- Main backdrop -->
<div class="fixed inset-0 flex items-center justify-center p-4 pixel-grid pixel-theme">
  <!-- Scanline effect -->
  <div class="pixel-scanline"></div>

  <!-- Admin card - Pixel style -->
  <div class="relative w-full max-w-md z-10">
    <!-- Glow effect -->
    <div class="absolute inset-0 pixel-pulse" style="z-index: -1; border: 4px solid var(--pixel-border);"></div>

    <div class="pixel-slide-in pixel-card p-8">
      <!-- Header - Terminal style -->
      <div class="text-center mb-8 pb-6" style="border-bottom: 3px dashed #0f3460;">
        <div class="mb-4 text-[#5ce1e6]" style="font-size: 8px; letter-spacing: 2px;">
          ▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼▲▼
        </div>
        <h1 class="text-white mb-3 pixel-text-shadow" style="font-size: 20px;">
          ADMIN PANEL
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
      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <div>
          <label for="email" class="block mb-2 text-[#53a8b6]" style="font-size: 8px; letter-spacing: 1px;">
            ► EMAIL
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="ADMIN@EXAMPLE.COM"
            required
            disabled={loading}
            class="w-full px-4 py-3 pixel-input text-white disabled:opacity-50"
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
            class="w-full px-4 py-3 pixel-input text-white disabled:opacity-50"
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
              ⏳ AUTENTICANDO...
            </span>
          {:else}
            ▶ ENTRAR NO ADMIN ◀
          {/if}
        </button>
      </form>

      <!-- Test credentials - Pixel style -->
      <div class="mt-8 pt-6" style="border-top: 3px dashed #0f3460;">
        <h3 class="text-[#5ce1e6] mb-4 text-center" style="font-size: 8px; letter-spacing: 2px;">
          ═══ CREDENCIAIS DE TESTE ═══
        </h3>
        <div class="space-y-3">
          <div class="px-4 py-3" style="background: #1a2332; border: 3px solid #2d5a8a; font-size: 8px;">
            <p class="text-[#5ce1e6] mb-1" style="letter-spacing: 1px;">EMAIL: ADMIN@EXAMPLE.COM</p>
            <p class="text-[#53a8b6]">SENHA: PWD</p>
            <p class="text-[#8b3a3a] mt-2">⚠️ SENHA É CASE-SENSITIVE</p>
          </div>
        </div>
      </div>

      <!-- Footer decoration -->
      <div class="mt-6 text-center text-[#0f3460]" style="font-size: 6px; letter-spacing: 2px;">
        ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
      </div>
    </div>
  </div>
</div>
