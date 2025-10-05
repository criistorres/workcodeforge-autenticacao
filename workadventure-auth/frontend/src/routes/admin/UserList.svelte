<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import ConfirmModal from '../../components/ConfirmModal.svelte';
  import SkeletonLoader from '../../components/SkeletonLoader.svelte';
  import { adminAPI } from '../../utils/api.js';
  import { toast } from '../../stores/toastStore.js';
  import { debounce } from '../../utils/debounce.js';

  let users = [];
  let loading = true;
  let error = '';
  let page = 1;
  let totalPages = 1;
  let search = '';
  let filters = {
    status: '',
    role: '',
    sort: 'createdAt',
    order: 'DESC'
  };

  // Modal states for quick actions
  let showBlockModal = false;
  let showUnblockModal = false;
  let selectedUser = null;
  let blockReason = '';

  async function loadUsers() {
    loading = true;
    error = '';

    try {
      const response = await adminAPI.getUsers({
        page,
        limit: 20,
        search,
        ...filters
      });
      users = response.data;
      totalPages = response.meta.totalPages;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  const debouncedSearch = debounce(() => {
    page = 1;
    loadUsers();
  }, 300);

  function handleSearch() {
    debouncedSearch();
  }

  function handleFilterChange() {
    page = 1;
    loadUsers();
  }

  function changePage(newPage) {
    page = newPage;
    loadUsers();
  }

  function openBlockModal(user) {
    selectedUser = user;
    blockReason = '';
    showBlockModal = true;
  }

  function openUnblockModal(user) {
    selectedUser = user;
    showUnblockModal = true;
  }

  async function confirmBlock() {
    if (!blockReason.trim()) {
      toast.warning('Por favor, informe o motivo do bloqueio');
      return;
    }

    try {
      await adminAPI.blockUser(selectedUser.id, true, blockReason);
      showBlockModal = false;
      blockReason = '';
      selectedUser = null;
      toast.success('Usuário bloqueado com sucesso!');
      await loadUsers();
    } catch (err) {
      toast.error('Erro ao bloquear: ' + err.message);
    }
  }

  async function confirmUnblock() {
    try {
      await adminAPI.blockUser(selectedUser.id, false);
      showUnblockModal = false;
      selectedUser = null;
      toast.success('Usuário desbloqueado com sucesso!');
      await loadUsers();
    } catch (err) {
      toast.error('Erro ao desbloquear: ' + err.message);
    }
  }

  onMount(() => {
    loadUsers();
  });
</script>

<AdminLayout title="Gerenciar Usuários">
  <!-- Barra de Pesquisa e Filtros -->
  <div class="mb-6 space-y-4">
    <!-- Busca -->
    <div class="relative max-w-xl">
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

    <!-- Filtros Avançados -->
    <div class="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5"></div>

      <div class="relative p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Filtro de Status -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">📊 Status</label>
            <select
              bind:value={filters.status}
              on:change={handleFilterChange}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 text-sm"
            >
              <option value="">Todos</option>
              <option value="active">✅ Ativos</option>
              <option value="inactive">⚠️ Inativos</option>
              <option value="blocked">🚫 Bloqueados</option>
            </select>
          </div>

          <!-- Ordenar por -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">📑 Ordenar por</label>
            <select
              bind:value={filters.sort}
              on:change={handleFilterChange}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 text-sm"
            >
              <option value="createdAt">Data de Criação</option>
              <option value="lastLogin">Último Login</option>
              <option value="name">Nome</option>
              <option value="email">Email</option>
            </select>
          </div>

          <!-- Ordem -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">⬆️⬇️ Ordem</label>
            <select
              bind:value={filters.order}
              on:change={handleFilterChange}
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 text-sm"
            >
              <option value="DESC">Decrescente</option>
              <option value="ASC">Crescente</option>
            </select>
          </div>

          <!-- Info -->
          <div class="flex items-end">
            <div class="w-full px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg">
              <span class="text-cyan-300 font-semibold text-sm">
                📈 {users.length} usuários
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if loading}
    <SkeletonLoader rows={10} type="table" />
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
                  <div class="flex justify-center gap-2">
                    <a href="/admin/users/{user.id}" use:link
                       class="relative px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105">
                      <span class="flex items-center gap-2 text-sm">
                        <span>👁️</span>
                        <span>Ver</span>
                      </span>
                    </a>

                    {#if user.blockedAt}
                      <button
                        on:click={() => openUnblockModal(user)}
                        class="relative px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:scale-105">
                        <span class="flex items-center gap-1 text-sm">
                          <span>✅</span>
                        </span>
                      </button>
                    {:else}
                      <button
                        on:click={() => openBlockModal(user)}
                        class="relative px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105">
                        <span class="flex items-center gap-1 text-sm">
                          <span>🚫</span>
                        </span>
                      </button>
                    {/if}
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

<!-- Modal de Bloqueio -->
<ConfirmModal
  bind:isOpen={showBlockModal}
  title="Bloquear Usuário"
  type="warning"
  confirmText="Bloquear"
  on:confirm={confirmBlock}
>
  <p class="text-gray-300 mb-4">Você está prestes a bloquear o usuário <strong>{selectedUser?.name}</strong>.</p>
  <label class="block text-sm font-medium text-gray-400 mb-2">Motivo do bloqueio:</label>
  <textarea
    bind:value={blockReason}
    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50"
    rows="3"
    placeholder="Digite o motivo do bloqueio..."
  ></textarea>
</ConfirmModal>

<!-- Modal de Desbloqueio -->
<ConfirmModal
  bind:isOpen={showUnblockModal}
  title="Desbloquear Usuário"
  message="Tem certeza que deseja desbloquear o usuário {selectedUser?.name}? O usuário poderá fazer login novamente."
  type="info"
  confirmText="Desbloquear"
  on:confirm={confirmUnblock}
/>
