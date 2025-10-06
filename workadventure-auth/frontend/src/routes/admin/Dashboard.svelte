<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';

  let stats = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    // Verificar se está autenticado
    const userId = localStorage.getItem('userId');
    if (!userId) {
      push('/admin/login');
      return;
    }

    try {
      stats = await adminAPI.getStats();
    } catch (err) {
      error = err.message;
      // Se receber 401, redirecionar para login
      if (err.message.includes('401') || err.message.includes('not authorized')) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        push('/admin/login');
      }
    } finally {
      loading = false;
    }
  });
</script>

<AdminLayout title="Dashboard">
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-xl animate-pulse"></div>
          <div class="relative text-6xl mb-4">⏳</div>
        </div>
        <p class="text-gray-400 font-medium text-lg">Carregando estatísticas...</p>
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
  {:else if stats}
    <div class="max-w-7xl space-y-8">
      <!-- Cards de Estatísticas - Estilo Gamer -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <!-- Total de Usuários -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-cyan-500/50 p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="text-5xl">👥</div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-cyan-300 uppercase tracking-wider mb-1">Total de Usuários</h3>
                <p class="text-4xl font-bold text-white">{stats.users.total}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span>Total registrado</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Usuários Ativos -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-green-500/50 p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="text-5xl">✅</div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-green-300 uppercase tracking-wider mb-1">Usuários Ativos</h3>
                <p class="text-4xl font-bold text-white">{stats.users.active}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Contas ativas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloqueados -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-yellow-500/50 p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="text-5xl">🚫</div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-yellow-300 uppercase tracking-wider mb-1">Bloqueados</h3>
                <p class="text-4xl font-bold text-white">{stats.users.blocked}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <span>Contas bloqueadas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Novos Hoje -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-purple-500/50 p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="text-5xl">✨</div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-1">Novos Hoje</h3>
                <p class="text-4xl font-bold text-white">{stats.users.newToday}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Registros hoje</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sessões Ativas -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-indigo-500/50 p-6 shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div class="flex items-center gap-4">
              <div class="text-5xl">🔌</div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-1">Sessões Ativas</h3>
                <p class="text-4xl font-bold text-white">{stats.sessions.active}</p>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700">
              <div class="flex items-center gap-2 text-xs text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span>Usuários conectados</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box - Bem-vindo -->
      <div class="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
        <!-- Efeito de brilho -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>

        <!-- Borda neon -->
        <div class="absolute inset-0 rounded-2xl border border-cyan-500/30"></div>

        <div class="relative p-8">
          <h2 class="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <span class="text-4xl">🎉</span>
            Bem-vindo ao Admin Panel
          </h2>

          <p class="text-gray-300 mb-6 text-lg">
            Use o menu lateral para navegar entre as seções do painel administrativo:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card Usuários -->
            <div class="group relative cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 group-hover:border-cyan-500/50 transition-all duration-300">
                <div class="text-4xl mb-3">👥</div>
                <h3 class="text-xl font-bold text-white mb-2">Usuários</h3>
                <p class="text-gray-400 text-sm">Gerenciar usuários do sistema, visualizar detalhes e atribuir roles</p>
              </div>
            </div>

            <!-- Card Roles -->
            <div class="group relative cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 group-hover:border-purple-500/50 transition-all duration-300">
                <div class="text-4xl mb-3">🎭</div>
                <h3 class="text-xl font-bold text-white mb-2">Roles</h3>
                <p class="text-gray-400 text-sm">Configurar permissões e roles para controlar o acesso ao sistema</p>
              </div>
            </div>

            <!-- Card Auditoria -->
            <div class="group relative cursor-pointer">
              <div class="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6 group-hover:border-green-500/50 transition-all duration-300">
                <div class="text-4xl mb-3">📋</div>
                <h3 class="text-xl font-bold text-white mb-2">Auditoria</h3>
                <p class="text-gray-400 text-sm">Ver logs de ações e monitorar atividades no sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>
