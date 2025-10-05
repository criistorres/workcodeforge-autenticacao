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
  <!-- Barra de Pesquisa com design gamer -->
  <div class="mb-6">
    <div class="relative max-w-xl">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-xl opacity-50"></div>

      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          type="text"
          placeholder="🔍 Buscar usuário por nome ou email..."
          bind:value={search}
          on:input={handleSearch}
          class="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
        />
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-xl animate-pulse"></div>
          <div class="relative text-6xl mb-4">⏳</div>
        </div>
        <p class="text-gray-400 font-medium text-lg">Carregando usuários...</p>
      </div>
    </div>
  {:else if error}
    <div class="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/50 rounded-xl p-6 text-red-200">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-semibold">❌ Erro: {error}</span>
      </div>
    </div>
  {:else}
    <!-- Tabela de Usuários - Estilo Gamer -->
    <div class="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
      <!-- Efeito de brilho -->
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>

      <div class="relative overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>👤</span> Nome
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>📧</span> Email
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>@</span> Username
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>🏷️</span> Tags
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>📊</span> Status
                </span>
              </th>
              <th class="px-6 py-4 text-left">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>🕐</span> Último Login
                </span>
              </th>
              <th class="px-6 py-4 text-center">
                <span class="text-cyan-400 font-bold uppercase tracking-wider text-sm">⚡ Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each users as user, i}
              <tr class="border-b border-gray-800 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-750 transition-all duration-300 group">
                <td class="px-6 py-4">
                  <span class="text-white font-semibold">{user.name}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-gray-300 font-mono text-sm">{user.email}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-purple-400 font-semibold">@{user.username}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-2">
                    {#each user.tags as tag}
                      <span class="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100 rounded-full text-xs font-bold border border-blue-500/50 shadow-lg">
                        {tag}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-6 py-4">
                  {#if user.blockedAt}
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg text-sm font-bold border border-yellow-500/50 shadow-lg">
                      <span>🚫</span> Bloqueado
                    </span>
                  {:else if user.isActive}
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-bold border border-green-500/50 shadow-lg">
                      <span>✅</span> Ativo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm font-bold border border-gray-500/50 shadow-lg">
                      <span>⚠️</span> Inativo
                    </span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <span class="text-gray-400 text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center">
                    <a href="/admin/users/{user.id}" use:link
                       class="relative px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 group">
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

      <!-- Paginação -->
      {#if totalPages > 1}
        <div class="border-t border-gray-700 p-6">
          <div class="flex justify-center items-center gap-4">
            <button
              on:click={() => changePage(page - 1)}
              disabled={page === 1}
              class="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span>Anterior</span>
              </span>
            </button>

            <div class="px-6 py-3 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-xl">
              <span class="text-cyan-300 font-bold">
                Página <span class="text-white text-lg">{page}</span> de <span class="text-white text-lg">{totalPages}</span>
              </span>
            </div>

            <button
              on:click={() => changePage(page + 1)}
              disabled={page === totalPages}
              class="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg">
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
