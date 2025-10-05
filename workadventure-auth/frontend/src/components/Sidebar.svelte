<script>
  import { link } from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  export let isOpen = true;
</script>

<aside class="relative h-screen transition-all duration-300 {isOpen ? 'w-64' : 'w-20'}">
  <!-- Background com gradiente gamer -->
  <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>

  <!-- Efeito de brilho lateral -->
  <div class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-pink-500/50"></div>

  <!-- Conteúdo -->
  <div class="relative h-full flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-700">
      <div class="flex items-center gap-3">
        <div class="text-3xl">⚡</div>
        {#if isOpen}
          <div class="flex-1">
            <h2 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              WorkCodeForge
            </h2>
            <p class="text-xs text-gray-400 font-semibold mt-1">Admin Panel</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Navegação -->
    <nav class="flex-1 py-4">
      <a href="/admin" use:link use:active
         class="group relative flex items-center gap-4 px-6 py-3 text-gray-300 hover:text-white transition-all duration-300">
        <!-- Barra lateral de indicação ativa -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 opacity-0 group-[.active]:opacity-100 transition-opacity"></div>

        <!-- Ícone -->
        <div class="text-2xl group-hover:scale-110 transition-transform duration-300">📊</div>

        {#if isOpen}
          <span class="font-semibold">Dashboard</span>
        {/if}

        <!-- Glow effect no hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity rounded-lg"></div>
      </a>

      <a href="/admin/users" use:link use:active
         class="group relative flex items-center gap-4 px-6 py-3 text-gray-300 hover:text-white transition-all duration-300">
        <!-- Barra lateral de indicação ativa -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 opacity-0 group-[.active]:opacity-100 transition-opacity"></div>

        <!-- Ícone -->
        <div class="text-2xl group-hover:scale-110 transition-transform duration-300">👥</div>

        {#if isOpen}
          <span class="font-semibold">Usuários</span>
        {/if}

        <!-- Glow effect no hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity rounded-lg"></div>
      </a>

      <a href="/admin/roles" use:link use:active
         class="group relative flex items-center gap-4 px-6 py-3 text-gray-300 hover:text-white transition-all duration-300">
        <!-- Barra lateral de indicação ativa -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 opacity-0 group-[.active]:opacity-100 transition-opacity"></div>

        <!-- Ícone -->
        <div class="text-2xl group-hover:scale-110 transition-transform duration-300">🎭</div>

        {#if isOpen}
          <span class="font-semibold">Roles</span>
        {/if}

        <!-- Glow effect no hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity rounded-lg"></div>
      </a>

      <a href="/admin/logs" use:link use:active
         class="group relative flex items-center gap-4 px-6 py-3 text-gray-300 hover:text-white transition-all duration-300">
        <!-- Barra lateral de indicação ativa -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 opacity-0 group-[.active]:opacity-100 transition-opacity"></div>

        <!-- Ícone -->
        <div class="text-2xl group-hover:scale-110 transition-transform duration-300">📜</div>

        {#if isOpen}
          <span class="font-semibold">Auditoria</span>
        {/if}

        <!-- Glow effect no hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity rounded-lg"></div>
      </a>
    </nav>

    <!-- Footer -->
    <div class="border-t border-gray-700 p-4">
      <a href="/" use:link
         class="group relative flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-200 transition-all duration-300 rounded-lg hover:bg-gray-800/50">
        <!-- Ícone -->
        <div class="text-2xl group-hover:scale-110 transition-transform duration-300">🚪</div>

        {#if isOpen}
          <span class="font-semibold text-sm">Voltar ao Login</span>
        {/if}
      </a>

      <!-- Informações do sistema -->
      {#if isOpen}
        <div class="mt-4 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs font-semibold text-green-400">Sistema Online</span>
          </div>
          <p class="text-xs text-gray-500">v2.0.0 - Gamer Edition</p>
        </div>
      {/if}
    </div>
  </div>
</aside>
