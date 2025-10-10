<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import { adminAPI } from '../../utils/api.js';

  export let params = {};

  let user = null;
  let allRoles = [];
  let loading = true;
  let error = '';
  let editing = false;
  let editingRoles = false;
  let selectedRoles = [];

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
      alert('✅ Usuário atualizado com sucesso!');
    } catch (err) {
      alert('❌ Erro ao atualizar: ' + err.message);
    }
  }

  async function handleSaveRoles() {
    try {
      const userId = localStorage.getItem('userId');
      await adminAPI.assignRoles(params.id, selectedRoles);
      editingRoles = false;
      await loadUser();
      alert('✅ Roles atualizadas com sucesso!');
    } catch (err) {
      alert('❌ Erro ao atualizar roles: ' + err.message);
    }
  }

  async function handleBlock() {
    const reason = prompt('Motivo do bloqueio:');
    if (!reason) return;

    try {
      await adminAPI.blockUser(params.id, true, reason);
      await loadUser();
      alert('✅ Usuário bloqueado!');
    } catch (err) {
      alert('❌ Erro: ' + err.message);
    }
  }

  async function handleUnblock() {
    if (!confirm('Desbloquear este usuário?')) return;

    try {
      await adminAPI.blockUser(params.id, false);
      await loadUser();
      alert('✅ Usuário desbloqueado!');
    } catch (err) {
      alert('❌ Erro: ' + err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('⚠️ ATENÇÃO: Deletar este usuário? Esta ação não pode ser desfeita!')) return;

    try {
      await adminAPI.deleteUser(params.id);
      alert('✅ Usuário deletado!');
      push('/admin/users');
    } catch (err) {
      alert('❌ Erro: ' + err.message);
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
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="text-4xl mb-2">⏳</div>
        <p class="text-dark-500">Carregando...</p>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      ❌ Erro: {error}
    </div>
  {:else if user}
    <div class="max-w-6xl space-y-6">
      <!-- Header com ações -->
      <div class="flex justify-between items-center">
        <button on:click={() => push('/admin/users')} class="btn-secondary">
          ← Voltar
        </button>
        <div class="flex gap-2">
          {#if !editing}
            <button on:click={() => editing = true} class="btn bg-blue-600 text-white hover:bg-blue-700">
              ✏️ Editar
            </button>
          {/if}
          {#if user.blockedAt}
            <button on:click={handleUnblock} class="btn-success">✅ Desbloquear</button>
          {:else}
            <button on:click={handleBlock} class="btn bg-yellow-600 text-white hover:bg-yellow-700">
              🚫 Bloquear
            </button>
          {/if}
          <button on:click={handleDelete} class="btn-danger">🗑️ Deletar</button>
        </div>
      </div>

      <!-- Card de Informações Básicas -->
      <div class="card">
        <h2 class="text-xl font-bold text-dark-900 mb-6 flex items-center gap-2">
          <span class="text-2xl">👤</span>
          Informações Básicas
        </h2>

        {#if editing}
          <form on:submit|preventDefault={handleSave} class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-dark-700 mb-2">Nome</label>
                <input type="text" bind:value={formData.name} class="input" required />
              </div>
              <div>
                <label class="block text-sm font-medium text-dark-700 mb-2">Username</label>
                <input type="text" bind:value={formData.username} class="input" required />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-700 mb-2">Email</label>
              <input type="email" bind:value={formData.email} class="input" required />
            </div>

            <div>
              <label class="block text-sm font-medium text-dark-700 mb-2">Mapa Padrão</label>
              <select bind:value={formData.defaultMap} class="input">
                <option value="main">Principal (main)</option>
                <option value="filial1">Filial 1</option>
                <option value="filial2">Filial 2</option>
                <option value="sede">Sede</option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" bind:checked={formData.isActive} class="w-4 h-4 text-primary-600" />
              <label class="text-sm font-medium text-dark-700">Conta Ativa</label>
            </div>

            <div class="flex gap-2 pt-4">
              <button type="submit" class="btn-success">💾 Salvar</button>
              <button type="button" on:click={() => editing = false} class="btn-secondary">❌ Cancelar</button>
            </div>
          </form>
        {:else}
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">ID</p>
              <p class="text-dark-900 font-mono text-sm">{user.id.substring(0, 8)}...</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Nome</p>
              <p class="text-dark-900 font-medium">{user.name}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Email</p>
              <p class="text-dark-900">{user.email}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Username</p>
              <p class="text-dark-900">@{user.username}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Status</p>
              <p class="text-dark-900">
                {#if user.blockedAt}
                  <span class="badge-danger">🚫 Bloqueado</span>
                {:else if user.isActive}
                  <span class="badge-success">✅ Ativo</span>
                {:else}
                  <span class="badge-warning">⚠️ Inativo</span>
                {/if}
              </p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Email Verificado</p>
              <p class="text-dark-900">{user.isEmailVerified ? '✅ Sim' : '❌ Não'}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Criado em</p>
              <p class="text-dark-900 text-sm">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Último Login</p>
              <p class="text-dark-900 text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</p>
            </div>
            <div>
              <p class="text-xs text-dark-500 uppercase tracking-wide mb-1">Mapa Padrão</p>
              <p class="text-dark-900 font-medium">🗺️ {user.defaultMap || 'main'}</p>
            </div>
          </div>

          {#if user.blockedReason}
            <div class="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p class="text-sm font-medium text-yellow-800">Motivo do Bloqueio:</p>
              <p class="text-sm text-yellow-700 mt-1">{user.blockedReason}</p>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Card de Roles - Estilo Gamer Premium -->
      <div class="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
        <!-- Efeito de brilho gamer -->
        <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>

        <!-- Borda neon -->
        <div class="absolute inset-0 rounded-2xl border border-cyan-500/30"></div>

        <div class="relative p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <span class="text-3xl">🎭</span>
              Roles & Permissões
            </h2>
            {#if !editingRoles}
              <button on:click={() => editingRoles = true}
                      class="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105">
                <span class="flex items-center gap-2">
                  <span>✏️</span>
                  <span>Editar Roles</span>
                </span>
              </button>
            {/if}
          </div>

          {#if editingRoles}
            <div class="space-y-6">
              <div class="flex items-center gap-2 text-cyan-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm font-medium">Selecione as roles para este usuário:</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each allRoles as role}
                  <label class="group relative cursor-pointer">
                    <!-- Borda com gradiente animado quando selecionado -->
                    <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                {selectedRoles.includes(role.id) ? 'opacity-75' : ''}"></div>

                    <div class="relative m-[2px] p-4 rounded-xl bg-gray-800 transition-all duration-300
                                {selectedRoles.includes(role.id) ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'hover:bg-gray-750'}">
                      <div class="flex items-start gap-3">
                        <!-- Checkbox customizado -->
                        <div class="relative flex items-center justify-center mt-1">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.id)}
                            on:change={() => toggleRole(role.id)}
                            class="w-5 h-5 opacity-0 absolute"
                          />
                          <div class="w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center
                                      {selectedRoles.includes(role.id)
                                        ? 'bg-gradient-to-br from-cyan-500 to-purple-500 border-cyan-400'
                                        : 'border-gray-600 group-hover:border-cyan-500'}">
                            {#if selectedRoles.includes(role.id)}
                              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            {/if}
                          </div>
                        </div>

                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <!-- Indicador de cor da role com glow -->
                            <div class="w-3 h-3 rounded-full shadow-lg"
                                 style="background-color: {role.color}; box-shadow: 0 0 10px {role.color}80;"></div>
                            <span class="font-bold text-white">{role.displayName}</span>
                          </div>
                          {#if role.description}
                            <p class="text-sm text-gray-400 leading-relaxed">{role.description}</p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </label>
                {/each}
              </div>

              <div class="flex gap-3 pt-4">
                <button on:click={handleSaveRoles}
                        class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:scale-105">
                  <span class="flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>Salvar Roles</span>
                  </span>
                </button>
                <button on:click={() => { editingRoles = false; selectedRoles = user.roles.map(r => r.id); }}
                        class="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600 transition-all duration-300">
                  <span class="flex items-center justify-center gap-2">
                    <span>❌</span>
                    <span>Cancelar</span>
                  </span>
                </button>
              </div>
            </div>
          {:else}
            <div class="flex flex-wrap gap-4">
              {#if user.roles && user.roles.length > 0}
                {#each user.roles as role}
                  <div class="group relative">
                    <!-- Glow effect -->
                    <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style="background: radial-gradient(circle at center, {role.color}40 0%, transparent 70%); filter: blur(10px);"></div>

                    <div class="relative px-6 py-4 rounded-xl border-2 transition-all duration-300 transform group-hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-900"
                         style="border-color: {role.color}60; box-shadow: 0 4px 20px {role.color}20;">
                      <div class="flex items-center gap-3 mb-2">
                        <div class="w-4 h-4 rounded-full shadow-lg"
                             style="background-color: {role.color}; box-shadow: 0 0 15px {role.color};"></div>
                        <span class="font-bold text-white text-lg">{role.displayName}</span>
                      </div>
                      {#if role.description}
                        <p class="text-sm text-gray-400 leading-relaxed">{role.description}</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="w-full text-center py-8">
                  <div class="text-5xl mb-3 opacity-50">🎭</div>
                  <p class="text-gray-500 font-medium">Nenhuma role atribuída</p>
                  <p class="text-gray-600 text-sm mt-1">Clique em "Editar Roles" para atribuir permissões</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Card de Sessões -->
      {#if user.sessions && user.sessions.length > 0}
        <div class="card">
          <h2 class="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
            <span class="text-2xl">🔌</span>
            Sessões Ativas ({user.sessions.length})
          </h2>
          <div class="space-y-2">
            {#each user.sessions as session}
              <div class="p-3 bg-dark-50 rounded-lg flex justify-between items-center">
                <div class="flex gap-6 text-sm">
                  <div>
                    <span class="text-dark-500">IP:</span>
                    <span class="text-dark-900 font-mono">{session.ipAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="text-dark-500">Criada:</span>
                    <span class="text-dark-900">{new Date(session.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <span class="badge-info">Ativa</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</AdminLayout>
