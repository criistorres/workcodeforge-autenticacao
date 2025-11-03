<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';
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
        <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando estatísticas...</p>
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
  {:else if stats}
    <div class="max-w-7xl space-y-6">
      <!-- Stat Cards Grid - Professional style -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <!-- Total Users -->
        <div class="stat-card group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Total de Usuários</p>
              <p class="text-3xl font-bold text-white">{stats.users.total}</p>
            </div>
            <Icon name="users" size="w-10 h-10" className="text-white/60 group-hover:text-[#5ce1e6] transition-all" />
          </div>
          <div class="flex items-center gap-2 pt-3" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
            <div class="flex-1">
              <p class="text-xs text-white/40 font-medium">Total registrado</p>
            </div>
          </div>
        </div>

        <!-- Active Users -->
        <div class="stat-card group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(34, 197, 94, 0.3); backdrop-filter: blur(10px);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Usuários Ativos</p>
              <p class="text-3xl font-bold text-green-400">{stats.users.active}</p>
            </div>
            <Icon name="check-circle" size="w-10 h-10" className="text-green-400/60 group-hover:text-green-400 transition-all" />
          </div>
          <div class="flex items-center gap-2 pt-3" style="border-top: 1px solid rgba(34, 197, 94, 0.15);">
            <div class="flex-1">
              <p class="text-xs text-white/40 font-medium">Contas ativas</p>
            </div>
          </div>
        </div>

        <!-- Blocked -->
        <div class="stat-card group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(239, 68, 68, 0.3); backdrop-filter: blur(10px);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Bloqueados</p>
              <p class="text-3xl font-bold text-red-400">{stats.users.blocked}</p>
            </div>
            <Icon name="ban" size="w-10 h-10" className="text-red-400/60 group-hover:text-red-400 transition-all" />
          </div>
          <div class="flex items-center gap-2 pt-3" style="border-top: 1px solid rgba(239, 68, 68, 0.15);">
            <div class="flex-1">
              <p class="text-xs text-white/40 font-medium">Contas bloqueadas</p>
            </div>
          </div>
        </div>

        <!-- New Today -->
        <div class="stat-card group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(234, 179, 8, 0.3); backdrop-filter: blur(10px);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Novos Hoje</p>
              <p class="text-3xl font-bold text-yellow-400">{stats.users.newToday}</p>
            </div>
            <Icon name="plus" size="w-10 h-10" className="text-yellow-400/60 group-hover:text-yellow-400 transition-all" />
          </div>
          <div class="flex items-center gap-2 pt-3" style="border-top: 1px solid rgba(234, 179, 8, 0.15);">
            <div class="flex-1">
              <p class="text-xs text-white/40 font-medium">Registros hoje</p>
            </div>
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="stat-card group p-6 rounded-xl transition-all duration-300 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.3); backdrop-filter: blur(10px);">
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Sessões Ativas</p>
              <p class="text-3xl font-bold text-[#5ce1e6]">{stats.sessions.active}</p>
            </div>
            <Icon name="wifi" size="w-10 h-10" className="text-[#5ce1e6]/60 group-hover:text-[#5ce1e6] transition-all" />
          </div>
          <div class="flex items-center gap-2 pt-3" style="border-top: 1px solid rgba(92, 225, 230, 0.15);">
            <div class="flex-1">
              <p class="text-xs text-white/40 font-medium">Usuários conectados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Welcome Section - Professional style -->
      <div class="p-8 rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
        <h2 class="text-2xl font-bold text-white mb-3">Bem-vindo ao Admin Panel</h2>
        <p class="text-white/60 mb-6" style="font-size: 14px; line-height: 1.6;">
          Use o menu lateral para navegar entre as seções do painel administrativo.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Users Card -->
          <div class="info-card p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.15);">
            <Icon name="users" size="w-10 h-10" className="text-[#5ce1e6] mb-3" />
            <h3 class="text-lg font-bold text-white mb-2">Usuários</h3>
            <p class="text-white/50 text-sm leading-relaxed">Gerenciar usuários do sistema, visualizar detalhes e atribuir roles</p>
          </div>

          <!-- Roles Card -->
          <div class="info-card p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.15);">
            <Icon name="roles" size="w-10 h-10" className="text-[#5ce1e6] mb-3" />
            <h3 class="text-lg font-bold text-white mb-2">Roles</h3>
            <p class="text-white/50 text-sm leading-relaxed">Configurar permissões e roles para controlar o acesso ao sistema</p>
          </div>

          <!-- Audit Card -->
          <div class="info-card p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.15);">
            <Icon name="audit" size="w-10 h-10" className="text-[#5ce1e6] mb-3" />
            <h3 class="text-lg font-bold text-white mb-2">Auditoria</h3>
            <p class="text-white/50 text-sm leading-relaxed">Ver logs de ações e monitorar atividades no sistema</p>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>

<style>
  .stat-card:hover {
    box-shadow: 0 8px 32px rgba(92, 225, 230, 0.15);
  }

  .info-card:hover {
    background: rgba(92, 225, 230, 0.08) !important;
    border-color: rgba(92, 225, 230, 0.3) !important;
  }
</style>
