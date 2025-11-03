<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';

  let users = [];
  let loading = true;
  let error = '';
  let page = 1;
  let totalPages = 1;
  let search = '';

  async function loadUsers() {
    loading = true;
    error = '';

    try {
      const response = await adminAPI.getUsers({ page, limit: 20, search });
      users = response.data;
      totalPages = response.meta.totalPages;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleSearch() {
    page = 1;
    loadUsers();
  }

  function changePage(newPage) {
    page = newPage;
    loadUsers();
  }

  onMount(() => {
    loadUsers();
  });
</script>

<AdminLayout title="Gerenciar Usuários">
  <!-- Search Bar -->
  <div class="mb-6">
    <div class="relative max-w-xl">
      <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <input
        type="text"
        placeholder="Buscar usuário por nome ou email..."
        bind:value={search}
        on:input={handleSearch}
        class="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200"
        style="border-color: rgba(86, 234, 255, 0.15); background-color: rgba(255, 255, 255, 0.05);"
      />
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="text-5xl mb-4">⏳</div>
        <p class="text-white/60 font-medium text-lg">Carregando usuários...</p>
      </div>
    </div>
  {:else if error}
    <div class="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-semibold">Erro: {error}</span>
      </div>
    </div>
  {:else}
    <!-- Users Table -->
    <div class="rounded-lg border backdrop-blur-sm overflow-hidden" style="background-color: rgba(43, 39, 59, 0.6); border-color: rgba(86, 234, 255, 0.25);">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b" style="border-color: rgba(86, 234, 255, 0.15);">
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>👤</span> Nome
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>📧</span> Email
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>@</span> Username
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>🏷️</span> Tags
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>📊</span> Status
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <span>🕐</span> Último Login
                </span>
              </th>
              <th class="px-6 py-4 text-center">
                <span class="text-white/70 font-bold uppercase tracking-wider text-xs">⚡ Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each users as user, i}
              <tr class="border-b hover:bg-white/5 transition-all duration-300" style="border-color: rgba(86, 234, 255, 0.1);">
                <td class="px-6 py-4">
                  <span class="text-white font-medium text-sm">{user.name}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-white/70 font-mono text-sm">{user.email}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-secondary text-sm" style="color: rgba(86, 234, 255, 0.7);">@{user.username}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-2">
                    {#each user.tags as tag}
                      <span class="px-2.5 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-md border border-secondary/30" style="background-color: rgba(86, 234, 255, 0.1); color: rgba(86, 234, 255, 0.8); border-color: rgba(86, 234, 255, 0.2);">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4">
                  {#if user.blockedAt}
                    <span class="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-md text-xs font-medium border border-red-500/30" style="background-color: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border-color: rgba(239, 68, 68, 0.3);">
                      <span>🚫</span> Bloqueado
                    </span>
                  {:else if user.isActive}
                    <span class="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-md text-xs font-medium border border-green-500/30" style="background-color: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border-color: rgba(34, 197, 94, 0.3);">
                      <span>✅</span> Ativo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/60 rounded-md text-xs font-medium border border-white/20" style="background-color: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border-color: rgba(255, 255, 255, 0.15);">
                      <span>⚠️</span> Inativo
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <span class="text-white/50 text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center">
                    <a href="#/admin/users/{user.id}" use:link
                       class="px-3 py-1.5 bg-secondary text-contrast text-xs font-bold rounded-md hover:bg-secondary/90 transition-all duration-200"
                       style="background-color: rgba(86, 234, 255, 0.8); color: rgba(43, 39, 59, 0.9);">
                      <span class="flex items-center gap-2">
                        <span>👁️</span>
                        <span>Ver</span>
                      </span>
                    </a>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="border-t p-6" style="border-color: rgba(86, 234, 255, 0.15);">
          <div class="flex justify-center items-center gap-4">
            <button
              on:click={() => changePage(page - 1)}
              disabled={page === 1}
              class="px-4 py-2 bg-contrast/70 text-white/70 rounded-md font-medium text-sm hover:bg-contrast/90 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style="background-color: rgba(43, 39, 59, 0.7); color: rgba(255, 255, 255, 0.7);">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span>Anterior</span>
              </span>
            </button>

            <div class="px-4 py-2 bg-secondary/15 border border-secondary/30 rounded-md text-xs" style="background-color: rgba(86, 234, 255, 0.1); border-color: rgba(86, 234, 255, 0.2);">
              <span class="text-white/80">
                Página <span class="text-secondary font-bold" style="color: rgba(86, 234, 255, 0.8);">{page}</span> de <span class="text-secondary font-bold" style="color: rgba(86, 234, 255, 0.8);">{totalPages}</span>
              </span>
            </div>

            <button
              on:click={() => changePage(page + 1)}
              disabled={page === totalPages}
              class="px-4 py-2 bg-contrast/70 text-white/70 rounded-md font-medium text-sm hover:bg-contrast/90 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style="background-color: rgba(43, 39, 59, 0.7); color: rgba(255, 255, 255, 0.7);">
              <span class="flex items-center gap-2">
                <span>Próxima</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</AdminLayout>
