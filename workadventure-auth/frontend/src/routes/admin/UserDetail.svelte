<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';

  export let params = {};

  let user = null;
  let roles = [];
  let loading = true;
  let error = '';
  let editing = false;

  let formData = {
    name: '',
    email: '',
    isActive: true,
  };

  async function loadUser() {
    loading = true;
    try {
      user = await adminAPI.getUserDetails(params.id);
      formData = {
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      };
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadRoles() {
    try {
      roles = await adminAPI.getRoles();
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  }

  async function handleSave() {
    try {
      await adminAPI.updateUser(params.id, formData);
      editing = false;
      await loadUser();
      alert('Usuário atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message);
    }
  }

  async function handleBlock() {
    const reason = prompt('Motivo do bloqueio:');
    if (!reason) return;

    try {
      await adminAPI.blockUser(params.id, true, reason);
      await loadUser();
      alert('Usuário bloqueado!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function handleUnblock() {
    if (!confirm('Desbloquear este usuário?')) return;

    try {
      await adminAPI.blockUser(params.id, false);
      await loadUser();
      alert('Usuário desbloqueado!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('ATENÇÃO: Deletar este usuário? Esta ação não pode ser desfeita!')) return;

    try {
      await adminAPI.deleteUser(params.id);
      alert('Usuário deletado!');
      push('/admin/users');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  onMount(() => {
    loadUser();
    loadRoles();
  });
</script>

<AdminLayout title="Detalhes do Usuário">
  {#if loading}
    <div class="loading">⏳ Carregando...</div>
  {:else if error}
    <div class="error">❌ Erro: {error}</div>
  {:else if user}
    <div class="user-detail">
      <div class="header-actions">
        <button on:click={() => push('/admin/users')} class="btn-back">
          ← Voltar
        </button>
        <div class="actions">
          {#if !editing}
            <button on:click={() => editing = true} class="btn-edit">✏️ Editar</button>
          {/if}
          {#if user.blockedAt}
            <button on:click={handleUnblock} class="btn-unblock">✅ Desbloquear</button>
          {:else}
            <button on:click={handleBlock} class="btn-block">🚫 Bloquear</button>
          {/if}
          <button on:click={handleDelete} class="btn-delete">🗑️ Deletar</button>
        </div>
      </div>

      <div class="info-card">
        <h2>Informações Básicas</h2>

        {#if editing}
          <div class="form">
            <div class="form-group">
              <label>Nome:</label>
              <input type="text" bind:value={formData.name} />
            </div>

            <div class="form-group">
              <label>Email:</label>
              <input type="email" bind:value={formData.email} />
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" bind:checked={formData.isActive} />
                Conta Ativa
              </label>
            </div>

            <div class="form-actions">
              <button on:click={handleSave} class="btn-save">💾 Salvar</button>
              <button on:click={() => editing = false} class="btn-cancel">❌ Cancelar</button>
            </div>
          </div>
        {:else}
          <div class="info-grid">
            <div class="info-item">
              <strong>ID:</strong>
              <span>{user.id}</span>
            </div>
            <div class="info-item">
              <strong>Nome:</strong>
              <span>{user.name}</span>
            </div>
            <div class="info-item">
              <strong>Email:</strong>
              <span>{user.email}</span>
            </div>
            <div class="info-item">
              <strong>Username:</strong>
              <span>@{user.username}</span>
            </div>
            <div class="info-item">
              <strong>Status:</strong>
              <span>
                {#if user.blockedAt}
                  🚫 Bloqueado desde {new Date(user.blockedAt).toLocaleDateString('pt-BR')}
                {:else if user.isActive}
                  ✅ Ativo
                {:else}
                  ⚠️ Inativo
                {/if}
              </span>
            </div>
            <div class="info-item">
              <strong>Email Verificado:</strong>
              <span>{user.isEmailVerified ? '✅ Sim' : '❌ Não'}</span>
            </div>
            <div class="info-item">
              <strong>Criado em:</strong>
              <span>{new Date(user.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <div class="info-item">
              <strong>Último Login:</strong>
              <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}</span>
            </div>
          </div>

          {#if user.blockedReason}
            <div class="blocked-reason">
              <strong>Motivo do Bloqueio:</strong>
              <p>{user.blockedReason}</p>
            </div>
          {/if}
        {/if}
      </div>

      <div class="info-card">
        <h2>Roles & Permissões</h2>
        <div class="roles">
          {#if user.roles && user.roles.length > 0}
            {#each user.roles as role}
              <div class="role-badge" style="background-color: {role.color}20; border-color: {role.color}">
                <span class="role-name">{role.displayName}</span>
                {#if role.description}
                  <span class="role-desc">{role.description}</span>
                {/if}
              </div>
            {/each}
          {:else}
            <p>Nenhuma role atribuída</p>
          {/if}
        </div>
      </div>

      {#if user.sessions && user.sessions.length > 0}
        <div class="info-card">
          <h2>Sessões Ativas ({user.sessions.length})</h2>
          <div class="sessions">
            {#each user.sessions as session}
              <div class="session-item">
                <div>
                  <strong>IP:</strong> {session.ipAddress || 'N/A'}
                </div>
                <div>
                  <strong>Criada:</strong> {new Date(session.createdAt).toLocaleString('pt-BR')}
                </div>
                <div>
                  <strong>Expira:</strong> {new Date(session.expiresAt).toLocaleString('pt-BR')}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</AdminLayout>

<style>
  .loading, .error {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: #dc2626;
  }

  .user-detail {
    max-width: 1000px;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-back, .btn-edit, .btn-block, .btn-unblock, .btn-delete {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.2s;
  }

  .btn-back {
    background: #6b7280;
    color: white;
  }

  .btn-edit {
    background: #3b82f6;
    color: white;
  }

  .btn-block {
    background: #f59e0b;
    color: white;
  }

  .btn-unblock {
    background: #10b981;
    color: white;
  }

  .btn-delete {
    background: #dc2626;
    color: white;
  }

  button:hover {
    opacity: 0.9;
  }

  .info-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .info-card h2 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    font-size: 1.2rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-item strong {
    color: #6b7280;
    font-size: 0.85rem;
  }

  .info-item span {
    color: #1f2937;
    font-size: 1rem;
  }

  .blocked-reason {
    margin-top: 1rem;
    padding: 1rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
  }

  .blocked-reason p {
    margin: 0.5rem 0 0 0;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 500;
    color: #374151;
  }

  .form-group input[type="text"],
  .form-group input[type="email"] {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .btn-save {
    padding: 0.75rem 1.5rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-cancel {
    padding: 0.75rem 1.5rem;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .roles {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .role-badge {
    padding: 1rem;
    border: 2px solid;
    border-radius: 8px;
    min-width: 200px;
  }

  .role-name {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .role-desc {
    display: block;
    font-size: 0.85rem;
    color: #6b7280;
  }

  .sessions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .session-item {
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    display: flex;
    gap: 2rem;
  }

  .session-item strong {
    color: #6b7280;
    font-size: 0.85rem;
  }
</style>
