<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';
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
  <!-- Search Bar - Professional style -->
  <div class="mb-6">
    <div class="relative max-w-xl">
      <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Icon name="search" className="text-white/30" />
      </div>
      <input
        type="text"
        placeholder="Buscar usuário por nome ou email..."
        bind:value={search}
        on:input={handleSearch}
        class="w-full pl-12 pr-4 py-3 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none transition-all duration-200"
        style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);"
      />
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando usuários...</p>
      </div>
    </div>
  {:else if error}
    <div class="p-6 rounded-lg" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-red-300 font-semibold" style="font-size: 14px;">{error}</span>
      </div>
    </div>
  {:else}
    <!-- Users Table - Professional style -->
    <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom: 1px solid rgba(92, 225, 230, 0.15);">
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="user" size="w-4 h-4" /> Nome
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="email" size="w-4 h-4" /> Email
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="at" size="w-4 h-4" /> Username
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="tag" size="w-4 h-4" /> Tags
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="chart" size="w-4 h-4" /> Status
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Icon name="clock" size="w-4 h-4" /> Último Login
                </span>
              </th>
              <th class="px-6 py-4 text-center">
                <span class="text-white/60 font-semibold uppercase tracking-wider text-xs">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each users as user, i}
              <tr class="transition-all duration-200 hover:bg-white/5" style="border-bottom: 1px solid rgba(92, 225, 230, 0.08);">
                <td class="px-6 py-4">
                  <span class="text-white font-medium text-sm">{user.name}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-white/70 text-sm font-mono">{user.email}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[#5ce1e6] text-sm font-medium">@{user.username}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-2">
                    {#each user.tags as tag}
                      <span class="px-2.5 py-1 rounded-md text-xs font-semibold" style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4">
                  {#if user.blockedAt}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border: 1px solid rgba(239, 68, 68, 0.3);">
                      <span>🚫</span> Bloqueado
                    </span>
                  {:else if user.isActive}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                      <span>✅</span> Ativo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.15);">
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
                       class="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                       style="background: #5ce1e6; color: #0f1419;">
                      Ver Detalhes
                    </a>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination - Professional style -->
      {#if totalPages > 1}
        <div class="p-6" style="border-top: 1px solid rgba(92, 225, 230, 0.15);">
          <div class="flex justify-center items-center gap-4">
            <button
              on:click={() => changePage(page - 1)}
              disabled={page === 1}
              class="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              ← Anterior
            </button>

            <div class="px-4 py-2 rounded-lg text-sm font-semibold" style="background: rgba(92, 225, 230, 0.1); border: 1px solid rgba(92, 225, 230, 0.2);">
              <span class="text-white/80">
                Página <span class="text-[#5ce1e6]">{page}</span> de <span class="text-[#5ce1e6]">{totalPages}</span>
              </span>
            </div>

            <button
              on:click={() => changePage(page + 1)}
              disabled={page === totalPages}
              class="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              Próxima →
            </button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</AdminLayout>
