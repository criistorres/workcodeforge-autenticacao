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
  <div class="toolbar">
    <div class="search-box">
      <input
        type="text"
        placeholder="Buscar usuário por nome ou email..."
        bind:value={search}
        on:input={handleSearch}
      />
    </div>
  </div>

  {#if loading}
    <div class="loading">⏳ Carregando usuários...</div>
  {:else if error}
    <div class="error">❌ Erro: {error}</div>
  {:else}
    <div class="user-table">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Username</th>
            <th>Tags</th>
            <th>Status</th>
            <th>Último Login</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>@{user.username}</td>
              <td>
                <div class="tags">
                  {#each user.tags as tag}
                    <span class="tag">{tag}</span>
                  {/each}
                </div>
              </td>
              <td>
                {#if user.blockedAt}
                  <span class="status blocked">🚫 Bloqueado</span>
                {:else if user.isActive}
                  <span class="status active">✅ Ativo</span>
                {:else}
                  <span class="status inactive">⚠️ Inativo</span>
                {/if}
              </td>
              <td>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
              </td>
              <td>
                <a href="/admin/users/{user.id}" use:link class="btn-view">👁️ Ver</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if totalPages > 1}
        <div class="pagination">
          <button on:click={() => changePage(page - 1)} disabled={page === 1}>
            ← Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button on:click={() => changePage(page + 1)} disabled={page === totalPages}>
            Próxima →
          </button>
        </div>
      {/if}
    </div>
  {/if}
</AdminLayout>

<style>
  .toolbar {
    margin-bottom: 1.5rem;
  }

  .search-box input {
    width: 100%;
    max-width: 400px;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
  }

  .search-box input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .loading, .error {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: #dc2626;
  }

  .user-table {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    background: #f9fafb;
  }

  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
  }

  tbody tr:hover {
    background: #f9fafb;
  }

  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag {
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .status.active {
    background: #d1fae5;
    color: #065f46;
  }

  .status.inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .status.blocked {
    background: #fef3c7;
    color: #92400e;
  }

  .btn-view {
    padding: 0.5rem 1rem;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .btn-view:hover {
    background: #5568d3;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .pagination button {
    padding: 0.5rem 1rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .pagination button:hover:not(:disabled) {
    background: #5568d3;
  }

  .pagination button:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }

  .pagination span {
    color: #6b7280;
    font-weight: 500;
  }
</style>
