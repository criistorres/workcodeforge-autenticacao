<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';
  import { adminAPI } from '../../utils/api.js';

  export let params = {};

  let user = null;
  let allRoles = [];
  let loading = true;
  let error = '';
  let editing = false;
  let editingRoles = false;
  let selectedRoles = [];
  let showBlockModal = false;
  let blockReason = '';
  let showDeleteModal = false;

  let formData = {
    name: '',
    email: '',
    username: '',
    isActive: true,
    defaultMap: 'main',
  };

  async function loadUser() {
    loading = true;
    try {
      user = await adminAPI.getUserDetails(params.id);
      formData = {
        name: user.name,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        defaultMap: user.defaultMap || 'main',
      };
      selectedRoles = user.roles ? user.roles.map(r => r.id) : [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function loadRoles() {
    try {
      allRoles = await adminAPI.getRoles();
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  }

  async function handleSave() {
    try {
      await adminAPI.updateUser(params.id, formData);
      editing = false;
      await loadUser();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleSaveRoles() {
    try {
      await adminAPI.assignRoles(params.id, selectedRoles);
      editingRoles = false;
      await loadUser();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleBlock() {
    if (!blockReason.trim()) return;

    try {
      await adminAPI.blockUser(params.id, true, blockReason);
      showBlockModal = false;
      blockReason = '';
      await loadUser();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleUnblock() {
    try {
      await adminAPI.blockUser(params.id, false);
      await loadUser();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleDelete() {
    try {
      await adminAPI.deleteUser(params.id);
      push('/admin/users');
    } catch (err) {
      error = err.message;
    }
  }

  function toggleRole(roleId) {
    if (selectedRoles.includes(roleId)) {
      selectedRoles = selectedRoles.filter(id => id !== roleId);
    } else {
      selectedRoles = [...selectedRoles, roleId];
    }
  }

  onMount(() => {
    loadUser();
    loadRoles();
  });
</script>

<AdminLayout title="Detalhes do Usuário">
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando detalhes...</p>
      </div>
    </div>
  {:else if error}
    <div class="p-6 rounded-lg" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
      <div class="flex items-center gap-3">
        <Icon name="ban" size="w-6 h-6" className="text-red-400" />
        <span class="text-red-300 font-semibold" style="font-size: 14px;">{error}</span>
      </div>
    </div>
  {:else if user}
    <div class="max-w-7xl space-y-6">
      <!-- Header with Actions -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <button
          on:click={() => push('/admin/users')}
          class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
          style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
          <Icon name="chevron-down" size="w-4 h-4" className="rotate-90" />
          Voltar
        </button>

        <div class="flex gap-2 flex-wrap">
          {#if !editing}
            <button
              on:click={() => editing = true}
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(59, 130, 246, 0.1); color: rgb(96, 165, 250); border: 1px solid rgba(59, 130, 246, 0.3);">
              <Icon name="list" size="w-4 h-4" />
              Editar
            </button>
          {/if}

          {#if user.blockedAt}
            <button
              on:click={handleUnblock}
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
              <Icon name="check-circle" size="w-4 h-4" />
              Desbloquear
            </button>
          {:else}
            <button
              on:click={() => showBlockModal = true}
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(234, 179, 8, 0.1); color: rgb(250, 204, 21); border: 1px solid rgba(234, 179, 8, 0.3);">
              <Icon name="ban" size="w-4 h-4" />
              Bloquear
            </button>
          {/if}

          <button
            on:click={() => showDeleteModal = true}
            class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
            style="background: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border: 1px solid rgba(239, 68, 68, 0.3);">
            <Icon name="ban" size="w-4 h-4" />
            Deletar
          </button>
        </div>
      </div>

      <!-- User Info Card -->
      <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="user" size="w-6 h-6" className="text-[#5ce1e6]" />
            <h2 class="text-xl font-bold text-white">Informações Básicas</h2>
          </div>

          {#if editing}
            <form on:submit|preventDefault={handleSave} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">Nome</label>
                  <input
                    type="text"
                    bind:value={formData.name}
                    required
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
                </div>

                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    bind:value={formData.username}
                    required
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
                </div>
              </div>

              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  bind:value={formData.email}
                  required
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
              </div>

              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Mapa Padrão</label>
                <select
                  bind:value={formData.defaultMap}
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);">
                  <option value="main">Principal (main)</option>
                  <option value="filial1">Filial 1</option>
                  <option value="filial2">Filial 2</option>
                  <option value="sede">Sede</option>
                </select>
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  bind:checked={formData.isActive}
                  class="w-5 h-5 rounded"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.3);" />
                <label class="text-white/70 text-sm font-medium">Conta Ativa</label>
              </div>

              <div class="flex gap-3 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
                <button
                  type="submit"
                  class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: #5ce1e6; color: #0f1419;">
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  on:click={() => { editing = false; formData = { name: user.name, email: user.email, username: user.username, isActive: user.isActive, defaultMap: user.defaultMap || 'main' }; }}
                  class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                  Cancelar
                </button>
              </div>
            </form>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">ID</p>
                <p class="text-white font-mono text-sm">{user.id.substring(0, 8)}...</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Nome</p>
                <p class="text-white font-medium">{user.name}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email</p>
                <p class="text-white">{user.email}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Username</p>
                <p class="text-[#5ce1e6] font-medium">@{user.username}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Status</p>
                {#if user.blockedAt}
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border: 1px solid rgba(239, 68, 68, 0.3);">
                    <Icon name="ban" size="w-4 h-4" />
                    Bloqueado
                  </span>
                {:else if user.isActive}
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                    <Icon name="check-circle" size="w-4 h-4" />
                    Ativo
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.15);">
                    Inativo
                  </span>
                {/if}
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email Verificado</p>
                <p class="text-white">{user.isEmailVerified ? 'Sim' : 'Não'}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Criado em</p>
                <p class="text-white text-sm">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Último Login</p>
                <p class="text-white text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</p>
              </div>

              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Mapa Padrão</p>
                <p class="text-white font-medium">{user.defaultMap || 'main'}</p>
              </div>
            </div>

            {#if user.blockedReason}
              <div class="mt-6 p-4 rounded-lg" style="background: rgba(234, 179, 8, 0.1); border-left: 4px solid rgb(234, 179, 8);">
                <p class="text-yellow-300 font-semibold text-sm mb-1">Motivo do Bloqueio:</p>
                <p class="text-white/70 text-sm">{user.blockedReason}</p>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Roles Card -->
      <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <Icon name="roles" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h2 class="text-xl font-bold text-white">Roles & Permissões</h2>
            </div>

            {#if !editingRoles}
              <button
                on:click={() => editingRoles = true}
                class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
                style="background: rgba(59, 130, 246, 0.1); color: rgb(96, 165, 250); border: 1px solid rgba(59, 130, 246, 0.3);">
                <Icon name="list" size="w-4 h-4" />
                Editar Roles
              </button>
            {/if}
          </div>

          {#if editingRoles}
            <div class="space-y-6">
              <div class="flex items-center gap-2 text-[#5ce1e6]">
                <Icon name="tag" size="w-5 h-5" />
                <p class="text-sm font-medium">Selecione as roles para este usuário:</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each allRoles as role}
                  <label class="group cursor-pointer">
                    <div class="p-4 rounded-lg transition-all duration-200 hover:bg-white/5"
                         style="border: 2px solid {selectedRoles.includes(role.id) ? role.color + '80' : 'rgba(92, 225, 230, 0.15)'};">
                      <div class="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role.id)}
                          on:change={() => toggleRole(role.id)}
                          class="mt-1 w-5 h-5 rounded"
                          style="accent-color: {role.color};"
                        />

                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <div class="w-3 h-3 rounded-full" style="background-color: {role.color};"></div>
                            <span class="font-bold text-white">{role.displayName}</span>
                          </div>
                          {#if role.description}
                            <p class="text-sm text-white/60 leading-relaxed">{role.description}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </label>
                {/each}
              </div>

              <div class="flex gap-3 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
                <button
                  on:click={handleSaveRoles}
                  class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: #5ce1e6; color: #0f1419;">
                  Salvar Roles
                </button>
                <button
                  on:click={() => { editingRoles = false; selectedRoles = user.roles ? user.roles.map(r => r.id) : []; }}
                  class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                  Cancelar
                </button>
              </div>
            </div>
          {:else}
            <div class="flex flex-wrap gap-3">
              {#if user.roles && user.roles.length > 0}
                {#each user.roles as role}
                  <div class="px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                       style="background: {role.color}20; border: 1px solid {role.color}60;">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" style="background-color: {role.color};"></div>
                      <span class="font-semibold text-white text-sm">{role.displayName}</span>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="w-full text-center py-8">
                  <Icon name="roles" size="w-16 h-16" className="text-white/20 mx-auto mb-3" />
                  <p class="text-white/50 font-medium">Nenhuma role atribuída</p>
                  <p class="text-white/30 text-sm mt-1">Clique em "Editar Roles" para atribuir permissões</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Sessions Card -->
      {#if user.sessions && user.sessions.length > 0}
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="wifi" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h2 class="text-xl font-bold text-white">Sessões Ativas ({user.sessions.length})</h2>
            </div>

            <div class="space-y-3">
              {#each user.sessions as session}
                <div class="p-4 rounded-lg" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.1);">
                  <div class="flex justify-between items-center flex-wrap gap-4">
                    <div class="flex gap-6 text-sm">
                      <div>
                        <span class="text-white/50">IP:</span>
                        <span class="text-white font-mono ml-2">{session.ipAddress || 'N/A'}</span>
                      </div>
                      <div>
                        <span class="text-white/50">Criada:</span>
                        <span class="text-white ml-2">{new Date(session.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                      Ativa
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Block Modal -->
  {#if showBlockModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 20, 25, 0.8); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.95) 0%, rgba(21, 26, 46, 0.95) 100%); border: 1px solid rgba(92, 225, 230, 0.15);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="ban" size="w-6 h-6" className="text-yellow-400" />
            <h3 class="text-xl font-bold text-white">Bloquear Usuário</h3>
          </div>

          <div class="mb-6">
            <label class="block text-white/70 text-sm font-semibold mb-2">Motivo do bloqueio</label>
            <textarea
              bind:value={blockReason}
              placeholder="Descreva o motivo do bloqueio..."
              rows="4"
              class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none resize-none"
              style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"></textarea>
          </div>

          <div class="flex gap-3">
            <button
              on:click={handleBlock}
              disabled={!blockReason.trim()}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background: rgb(234, 179, 8); color: #0f1419;">
              Bloquear
            </button>
            <button
              on:click={() => { showBlockModal = false; blockReason = ''; }}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Modal -->
  {#if showDeleteModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 20, 25, 0.8); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.95) 0%, rgba(21, 26, 46, 0.95) 100%); border: 1px solid rgba(239, 68, 68, 0.3);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="ban" size="w-6 h-6" className="text-red-400" />
            <h3 class="text-xl font-bold text-white">Deletar Usuário</h3>
          </div>

          <p class="text-white/70 mb-6 leading-relaxed">
            Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita e todos os dados associados serão permanentemente removidos.
          </p>

          <div class="flex gap-3">
            <button
              on:click={handleDelete}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgb(239, 68, 68); color: white;">
              Deletar
            </button>
            <button
              on:click={() => showDeleteModal = false}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>
