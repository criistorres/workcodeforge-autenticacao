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
    <div class="loading">⏳ Carregando estatísticas...</div>
  {:else if error}
    <div class="error">❌ Erro: {error}</div>
  {:else if stats}
    <div class="dashboard">
      <div class="cards">
        <div class="card">
          <div class="card-icon">👥</div>
          <div class="card-content">
            <h3>Total de Usuários</h3>
            <p class="value">{stats.users.total}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <h3>Usuários Ativos</h3>
            <p class="value">{stats.users.active}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">🚫</div>
          <div class="card-content">
            <h3>Bloqueados</h3>
            <p class="value">{stats.users.blocked}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">✨</div>
          <div class="card-content">
            <h3>Novos Hoje</h3>
            <p class="value">{stats.users.newToday}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-icon">🔌</div>
          <div class="card-content">
            <h3>Sessões Ativas</h3>
            <p class="value">{stats.sessions.active}</p>
          </div>
        </div>
      </div>

      <div class="info-box">
        <h2>🎉 Bem-vindo ao Admin Panel</h2>
        <p>Use o menu lateral para navegar entre as seções:</p>
        <ul>
          <li><strong>Usuários:</strong> Gerenciar usuários do sistema</li>
          <li><strong>Roles:</strong> Configurar permissões e roles</li>
          <li><strong>Auditoria:</strong> Ver logs de ações</li>
        </ul>
      </div>
    </div>
  {/if}
</AdminLayout>

<style>
  .loading, .error {
    padding: 2rem;
    text-align: center;
    font-size: 1.2rem;
  }

  .error {
    color: #dc2626;
  }

  .dashboard {
    max-width: 1200px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card-icon {
    font-size: 2.5rem;
  }

  .card-content h3 {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 500;
  }

  .card-content .value {
    margin: 0.5rem 0 0 0;
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
  }

  .info-box {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .info-box h2 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .info-box p {
    margin: 0 0 1rem 0;
    color: #6b7280;
  }

  .info-box ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .info-box li {
    margin-bottom: 0.5rem;
    color: #4b5563;
  }
</style>
