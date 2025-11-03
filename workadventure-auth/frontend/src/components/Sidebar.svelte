<script>
  import { link } from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  export let isOpen = true;
</script>

<aside class="relative h-screen transition-all duration-300 {isOpen ? 'w-64' : 'w-20'}">
  <!-- Background -->
  <div class="absolute inset-0 bg-contrast" style="background-color: rgba(43, 39, 59, 0.9);"></div>

  <!-- Border right -->
  <div class="absolute inset-y-0 right-0 w-px bg-secondary/20" style="background-color: rgba(86, 234, 255, 0.2);"></div>

  <!-- Content -->
  <div class="relative h-full flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b" style="border-color: rgba(86, 234, 255, 0.1);">
      <div class="flex items-center gap-3">
        <div class="text-2xl">⚡</div>
        {#if isOpen}
          <div class="flex-1">
            <h2 class="text-lg font-bold text-white">
              WorkCodeForge
            </h2>
            <p class="text-xs text-white/50 font-semibold mt-1">Admin Panel</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 space-y-1 px-3">
      <a href="#/admin" use:link use:active
         class="group relative flex items-center gap-4 px-4 py-3 text-white/70 hover:text-white transition-all duration-300 rounded-md"
         style="border-color: rgba(86, 234, 255, 0.3);">
        <div class="text-lg">📊</div>
        {#if isOpen}
          <span class="font-medium text-sm">Dashboard</span>
        {/if}
        <div class="absolute inset-0 rounded-md bg-secondary/10 opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity pointer-events-none" style="background-color: rgba(86, 234, 255, 0.1);"></div>
      </a>

      <a href="#/admin/users" use:link use:active
         class="group relative flex items-center gap-4 px-4 py-3 text-white/70 hover:text-white transition-all duration-300 rounded-md"
         style="border-color: rgba(86, 234, 255, 0.3);">
        <div class="text-lg">👥</div>
        {#if isOpen}
          <span class="font-medium text-sm">Usuários</span>
        {/if}
        <div class="absolute inset-0 rounded-md bg-secondary/10 opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity pointer-events-none" style="background-color: rgba(86, 234, 255, 0.1);"></div>
      </a>

      <a href="#/admin/roles" use:link use:active
         class="group relative flex items-center gap-4 px-4 py-3 text-white/70 hover:text-white transition-all duration-300 rounded-md"
         style="border-color: rgba(86, 234, 255, 0.3);">
        <div class="text-lg">🎭</div>
        {#if isOpen}
          <span class="font-medium text-sm">Roles</span>
        {/if}
        <div class="absolute inset-0 rounded-md bg-secondary/10 opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity pointer-events-none" style="background-color: rgba(86, 234, 255, 0.1);"></div>
      </a>

      <a href="#/admin/logs" use:link use:active
         class="group relative flex items-center gap-4 px-4 py-3 text-white/70 hover:text-white transition-all duration-300 rounded-md"
         style="border-color: rgba(86, 234, 255, 0.3);">
        <div class="text-lg">📜</div>
        {#if isOpen}
          <span class="font-medium text-sm">Auditoria</span>
        {/if}
        <div class="absolute inset-0 rounded-md bg-secondary/10 opacity-0 group-hover:opacity-100 group-[.active]:opacity-100 transition-opacity pointer-events-none" style="background-color: rgba(86, 234, 255, 0.1);"></div>
      </a>
    </nav>

    <!-- Footer -->
    <div class="border-t" style="border-color: rgba(86, 234, 255, 0.1); padding: 1rem;">
      <a href="#/" use:link
         class="group relative flex items-center gap-4 px-4 py-3 text-white/60 hover:text-white/90 transition-all duration-300 rounded-md hover:bg-white/5">
        <div class="text-lg">🚪</div>
        {#if isOpen}
          <span class="font-medium text-sm">Voltar</span>
        {/if}
      </a>

      <!-- System info -->
      {#if isOpen}
        <div class="mt-4 px-4 py-3 rounded-md border" style="background-color: rgba(86, 234, 255, 0.05); border-color: rgba(86, 234, 255, 0.15);">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 rounded-full animate-pulse" style="background-color: rgba(86, 234, 255, 0.6);"></div>
            <span class="text-xs font-semibold text-secondary" style="color: rgba(86, 234, 255, 0.7);">Sistema Online</span>
          </div>
          <p class="text-xs text-white/40">v2.0.0</p>
        </div>
      {/if}
    </div>
  </div>
</aside>

<style>
  :global(.active) {
    background-color: rgba(86, 234, 255, 0.15) !important;
    color: #56EAFF !important;
  }
</style>
