<script>
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';
  import { toast } from '../../stores/toastStore.js';

  let logs = [];
  let loading = true;
  let error = '';
  let page = 1;
  let totalPages = 1;
  let filters = {
    userId: '',
    action: '',
    startDate: '',
    endDate: ''
  };

  const actionTypes = [
    { value: '', label: 'Todas as ações' },
    { value: 'user.block', label: '🚫 Bloqueio de usuário' },
    { value: 'user.unblock', label: '✅ Desbloqueio de usuário' },
    { value: 'user.delete', label: '🗑️ Deleção de usuário' },
    { value: 'role.assign', label: '🎭 Atribuição de roles' },
    { value: 'user.edit', label: '✏️ Edição de usuário' },
  ];

  async function loadLogs() {
    loading = true;
    error = '';

    try {
      const response = await adminAPI.getAuditLogs({
        page,
        limit: 50,
        ...filters
      });
      logs = response.data;
      totalPages = response.meta.totalPages;
    } catch (err) {
      error = err.message;
      toast.error('Erro ao carregar logs: ' + err.message);
    } finally {
      loading = false;
    }
  }

  function handleFilter() {
    page = 1;
    loadLogs();
  }

  function clearFilters() {
    filters = { userId: '', action: '', startDate: '', endDate: '' };
    page = 1;
    loadLogs();
  }

  function changePage(newPage) {
    page = newPage;
    loadLogs();
  }

  function getActionIcon(action) {
    const icons = {
      'user.block': '🚫',
      'user.unblock': '✅',
      'user.delete': '🗑️',
      'role.assign': '🎭',
      'user.edit': '✏️',
      'login': '🔑',
      'logout': '🚪'
    };
    return icons[action] || '📝';
  }

  function getActionColor(action) {
    if (action.includes('delete')) return 'from-red-600 to-orange-600 border-red-500/50';
    if (action.includes('block')) return 'from-yellow-600 to-orange-600 border-yellow-500/50';
    if (action.includes('unblock')) return 'from-green-600 to-emerald-600 border-green-500/50';
    if (action.includes('role')) return 'from-purple-600 to-pink-600 border-purple-500/50';
    return 'from-blue-600 to-cyan-600 border-blue-500/50';
  }

  onMount(() => {
    loadLogs();
  });
</script>

<AdminLayout title="Auditoria e Logs">
  <!-- Filtros -->
  <div class="mb-6 relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>

    <div class="relative p-6">
      <h3 class="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
        <span>🔍</span>
        Filtros
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Tipo de Ação</label>
          <select
            bind:value={filters.action}
            on:change={handleFilter}
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
          >
            {#each actionTypes as actionType}
              <option value={actionType.value}>{actionType.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Data Inicial</label>
          <input
            type="date"
            bind:value={filters.startDate}
            on:change={handleFilter}
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-400 mb-2">Data Final</label>
          <input
            type="date"
            bind:value={filters.endDate}
            on:change={handleFilter}
            class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div class="flex items-end">
          <button
            on:click={clearFilters}
            class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-300"
          >
            ❌ Limpar Filtros
          </button>
        </div>
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
        <p class="text-gray-400 font-medium text-lg">Carregando logs...</p>
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
    <!-- Timeline de Logs -->
    <div class="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
      <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>

      <div class="relative p-6">
        <h3 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <span class="text-3xl">📜</span>
          Histórico de Ações ({logs.length} registros)
        </h3>

        {#if logs.length === 0}
          <div class="text-center py-12">
            <div class="text-6xl mb-4 opacity-50">📭</div>
            <p class="text-gray-400 font-medium">Nenhum log encontrado</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each logs as log}
              <div class="group relative">
                <!-- Linha conectora (exceto último) -->
                <div class="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent"></div>

                <div class="relative bg-gray-800/50 rounded-xl border border-gray-700 p-4 hover:bg-gray-800 hover:border-cyan-500/50 transition-all duration-300">
                  <div class="flex items-start gap-4">
                    <!-- Ícone da ação -->
                    <div class="relative">
                      <div class="absolute inset-0 bg-gradient-to-r {getActionColor(log.action)} rounded-xl blur-lg opacity-50"></div>
                      <div class="relative w-12 h-12 bg-gradient-to-r {getActionColor(log.action)} border rounded-xl flex items-center justify-center text-2xl">
                        {getActionIcon(log.action)}
                      </div>
                    </div>

                    <!-- Informações -->
                    <div class="flex-1">
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <h4 class="font-bold text-white text-lg">{log.action}</h4>
                          {#if log.user}
                            <p class="text-sm text-gray-400">
                              Por: <span class="text-cyan-400 font-semibold">{log.user.name}</span>
                              ({log.user.email})
                            </p>
                          {/if}
                        </div>
                        <span class="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {#if log.metadata}
                        <div class="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                          <p class="text-xs text-gray-500 mb-1 font-semibold">Detalhes:</p>
                          <pre class="text-sm text-gray-300 font-mono overflow-x-auto">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      {/if}

                      {#if log.ipAddress}
                        <p class="text-xs text-gray-500 mt-2">
                          🌐 IP: <span class="font-mono">{log.ipAddress}</span>
                        </p>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Paginação -->
        {#if totalPages > 1}
          <div class="border-t border-gray-700 mt-6 pt-6">
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
    </div>
  {/if}
</AdminLayout>
