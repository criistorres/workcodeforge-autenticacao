<script>
  import { link } from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';

  export let isOpen = true;

  // Estado de subitens expandidos
  let expandedMenus = {};

  // Carregar estado da sidebar do localStorage
  onMount(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      isOpen = savedState === 'true';
    }
  });

  function toggleSidebar() {
    isOpen = !isOpen;
    localStorage.setItem('sidebarOpen', isOpen.toString());
  }

  function toggleSubmenu(menu) {
    expandedMenus[menu] = !expandedMenus[menu];
  }
</script>

<aside class="fixed left-0 top-0 h-screen transition-all duration-300 z-40 {isOpen ? 'w-64' : 'w-20'}" style="background: linear-gradient(180deg, #1a1f35 0%, #151a2e 100%); border-right: 1px solid rgba(92, 225, 230, 0.15); font-family: 'Inter', sans-serif;">
  <!-- Content -->
  <div class="relative h-full flex flex-col">
    <!-- Logo Section - Improved -->
    <div class="relative p-6" style="border-bottom: 1px solid rgba(92, 225, 230, 0.1);">
      <div class="flex items-center {isOpen ? 'justify-between' : 'justify-center'}">
        {#if isOpen}
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg" style="background: linear-gradient(135deg, #5ce1e6 0%, #53a8b6 100%);">
              <span class="text-xl font-bold text-[#0f1419]">W</span>
            </div>
            <div class="flex-1">
              <h2 class="text-white font-bold" style="font-size: 16px; letter-spacing: -0.5px;">
                WorkCodeForge
              </h2>
              <p class="text-[#5ce1e6] mt-0.5" style="font-size: 10px; letter-spacing: 0.5px; font-weight: 600;">Admin Panel</p>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-center w-10 h-10 rounded-lg" style="background: linear-gradient(135deg, #5ce1e6 0%, #53a8b6 100%);">
            <span class="text-xl font-bold text-[#0f1419]">W</span>
          </div>
        {/if}
      </div>

      <!-- Toggle Button -->
      <button
        on:click={toggleSidebar}
        class="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style="background: linear-gradient(135deg, #5ce1e6 0%, #53a8b6 100%); box-shadow: 0 2px 8px rgba(92, 225, 230, 0.3);"
        title={isOpen ? 'Minimizar' : 'Expandir'}>
        <svg class="w-3 h-3 text-[#0f1419] transition-transform duration-200 {isOpen ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
    </div>

    <!-- Navigation - With submenu support -->
    <nav class="flex-1 py-4 space-y-1 px-3 overflow-y-auto custom-scrollbar">
      <!-- Dashboard -->
      <a href="#/admin" use:link use:active
         class="nav-item group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
         style="font-size: 14px; font-weight: 500;">
        <Icon name="dashboard" className="flex-shrink-0 text-white/70 group-hover:text-[#5ce1e6] transition-colors" />
        {#if isOpen}
          <span class="text-white/80 group-hover:text-white transition-colors">Dashboard</span>
        {/if}
      </a>

      <!-- Usuários - Com subitens -->
      <div>
        <button
          on:click={() => toggleSubmenu('users')}
          class="nav-item group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left"
          style="font-size: 14px; font-weight: 500;">
          <Icon name="users" className="flex-shrink-0 text-white/70 group-hover:text-[#5ce1e6] transition-colors" />
          {#if isOpen}
            <span class="text-white/80 group-hover:text-white transition-colors flex-1">Usuários</span>
            <Icon name="chevron-down" size="w-4 h-4" className="text-white/60 transition-transform duration-200 {expandedMenus['users'] ? 'rotate-180' : ''}" />
          {/if}
        </button>

        {#if isOpen && expandedMenus['users']}
          <div class="ml-4 mt-1 space-y-1" style="border-left: 2px solid rgba(92, 225, 230, 0.2); padding-left: 12px;">
            <a href="#/admin/users" use:link use:active
               class="submenu-item flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
              <Icon name="list" size="w-4 h-4" />
              Lista de Usuários
            </a>
            <a href="#/admin/users/new" use:link
               class="submenu-item flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
              <Icon name="plus" size="w-4 h-4" />
              Criar Usuário
            </a>
          </div>
        {/if}
      </div>

      <!-- Roles -->
      <a href="#/admin/roles" use:link use:active
         class="nav-item group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
         style="font-size: 14px; font-weight: 500;">
        <Icon name="roles" className="flex-shrink-0 text-white/70 group-hover:text-[#5ce1e6] transition-colors" />
        {#if isOpen}
          <span class="text-white/80 group-hover:text-white transition-colors">Roles</span>
        {/if}
      </a>

      <!-- Auditoria - Com subitens -->
      <div>
        <button
          on:click={() => toggleSubmenu('audit')}
          class="nav-item group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left"
          style="font-size: 14px; font-weight: 500;">
          <Icon name="audit" className="flex-shrink-0 text-white/70 group-hover:text-[#5ce1e6] transition-colors" />
          {#if isOpen}
            <span class="text-white/80 group-hover:text-white transition-colors flex-1">Auditoria</span>
            <Icon name="chevron-down" size="w-4 h-4" className="text-white/60 transition-transform duration-200 {expandedMenus['audit'] ? 'rotate-180' : ''}" />
          {/if}
        </button>

        {#if isOpen && expandedMenus['audit']}
          <div class="ml-4 mt-1 space-y-1" style="border-left: 2px solid rgba(92, 225, 230, 0.2); padding-left: 12px;">
            <a href="#/admin/logs" use:link use:active
               class="submenu-item flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
              <Icon name="database" size="w-4 h-4" />
              Logs do Sistema
            </a>
            <a href="#/admin/activity" use:link
               class="submenu-item flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200">
              <Icon name="activity" size="w-4 h-4" />
              Atividades Recentes
            </a>
          </div>
        {/if}
      </div>
    </nav>

    <!-- Footer - Professional style -->
    <div style="border-top: 1px solid rgba(92, 225, 230, 0.1); padding: 1rem;">
      <a href="#/" use:link
         class="group relative flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-200"
         style="font-size: 14px; font-weight: 500;">
        <Icon name="logout" className="flex-shrink-0 text-white/60 group-hover:text-white/80 transition-colors" />
        {#if isOpen}
          <span class="text-white/60 group-hover:text-white/80 transition-colors">Voltar</span>
        {/if}
      </a>

      <!-- System info - Professional style -->
      {#if isOpen}
        <div class="mt-4 px-4 py-3 rounded-lg" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.1);">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 rounded-full animate-pulse" style="background: #5ce1e6;"></div>
            <span style="font-size: 11px; color: #5ce1e6; font-weight: 600; letter-spacing: 0.3px;">Sistema Online</span>
          </div>
          <p class="text-white/40" style="font-size: 10px; font-weight: 500;">v2.0.0</p>
        </div>
      {/if}
    </div>
  </div>
</aside>

<style>
  .nav-item {
    position: relative;
    color: rgba(255, 255, 255, 0.7);
  }

  .nav-item:hover {
    background: rgba(92, 225, 230, 0.08);
  }

  .nav-item:global(.active) {
    background: linear-gradient(90deg, rgba(92, 225, 230, 0.15) 0%, rgba(92, 225, 230, 0.05) 100%);
    color: #5ce1e6 !important;
    border-left: 3px solid #5ce1e6;
  }

  .nav-item:global(.active) span {
    color: #5ce1e6 !important;
  }

  .submenu-item:global(.active) {
    background: rgba(92, 225, 230, 0.1);
    color: #5ce1e6 !important;
  }

  /* Custom Scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(92, 225, 230, 0.05);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(92, 225, 230, 0.2);
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(92, 225, 230, 0.3);
  }
</style>
