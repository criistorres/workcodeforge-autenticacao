<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';

  let stats = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      push('/admin/login');
      return;
    }

    try {
      stats = await adminAPI.getStats();
    } catch (err) {
      error = err.message;
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
        <div class="text-5xl mb-4">⏳</div>
        <p class="text-white/60 font-medium text-lg">Carregando estatísticas...</p>
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
  {:else if stats}
    <div class="max-w-7xl space-y-8">
      <!-- Stat Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <!-- Total Users -->
        <div class="p-6 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.7); border-color: rgba(86, 234, 255, 0.25);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Total de Usuários</p>
              <p class="text-3xl font-bold text-white">{stats.users.total}</p>
            </div>
            <div class="text-2xl">👥</div>
          </div>
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">Total registrado</p>
          </div>
        </div>

        <!-- Active Users -->
        <div class="p-6 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.7); border-color: rgba(86, 234, 255, 0.25);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Usuários Ativos</p>
              <p class="text-3xl font-bold text-white">{stats.users.active}</p>
            </div>
            <div class="text-2xl">✅</div>
          </div>
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">Contas ativas</p>
          </div>
        </div>

        <!-- Blocked -->
        <div class="p-6 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.7); border-color: rgba(86, 234, 255, 0.25);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Bloqueados</p>
              <p class="text-3xl font-bold text-white">{stats.users.blocked}</p>
            </div>
            <div class="text-2xl">🚫</div>
          </div>
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">Contas bloqueadas</p>
          </div>
        </div>

        <!-- New Today -->
        <div class="p-6 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.7); border-color: rgba(86, 234, 255, 0.25);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Novos Hoje</p>
              <p class="text-3xl font-bold text-white">{stats.users.newToday}</p>
            </div>
            <div class="text-2xl">✨</div>
          </div>
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">Registros hoje</p>
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="p-6 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.7); border-color: rgba(86, 234, 255, 0.25);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Sessões Ativas</p>
              <p class="text-3xl font-bold text-white">{stats.sessions.active}</p>
            </div>
            <div class="text-2xl">🔌</div>
          </div>
          <div class="pt-4 border-t border-white/10">
            <p class="text-xs text-white/50">Usuários conectados</p>
          </div>
        </div>
      </div>

      <!-- Welcome Section -->
      <div class="p-8 rounded-lg border backdrop-blur-sm" style="background-color: rgba(43, 39, 59, 0.6); border-color: rgba(86, 234, 255, 0.25);">
        <h2 class="text-2xl font-bold text-white mb-3">Bem-vindo ao Admin Panel</h2>
        <p class="text-white/70 mb-6">
          Use o menu lateral para navegar entre as seções do painel administrativo:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Users Card -->
          <div class="p-6 rounded-lg border transition-all duration-300 hover:border-secondary/50" style="background-color: rgba(43, 39, 59, 0.5); border-color: rgba(86, 234, 255, 0.15);">
            <div class="text-3xl mb-3">👥</div>
            <h3 class="text-lg font-bold text-white mb-2">Usuários</h3>
            <p class="text-white/60 text-sm">Gerenciar usuários do sistema, visualizar detalhes e atribuir roles</p>
          </div>

          <!-- Roles Card -->
          <div class="p-6 rounded-lg border transition-all duration-300 hover:border-secondary/50" style="background-color: rgba(43, 39, 59, 0.5); border-color: rgba(86, 234, 255, 0.15);">
            <div class="text-3xl mb-3">🎭</div>
            <h3 class="text-lg font-bold text-white mb-2">Roles</h3>
            <p class="text-white/60 text-sm">Configurar permissões e roles para controlar o acesso ao sistema</p>
          </div>

          <!-- Audit Card -->
          <div class="p-6 rounded-lg border transition-all duration-300 hover:border-secondary/50" style="background-color: rgba(43, 39, 59, 0.5); border-color: rgba(86, 234, 255, 0.15);">
            <div class="text-3xl mb-3">📋</div>
            <h3 class="text-lg font-bold text-white mb-2">Auditoria</h3>
            <p class="text-white/60 text-sm">Ver logs de ações e monitorar atividades no sistema</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>
