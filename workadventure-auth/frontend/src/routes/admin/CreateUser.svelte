<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';
  import { adminAPI } from '../../utils/api.js';
  import { toasts } from '../../stores/toast.js';

  let allRoles = [];
  let allMaps = [];
  let loading = false;
  let selectedRoles = [];

  let formData = {
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    telefone: '',
    cpf: '',
    departamento: '',
    isActive: true,
    defaultMap: '',
  };

  let errors = {
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  };

  async function loadRoles() {
    try {
      allRoles = await adminAPI.getRoles();
    } catch (err) {
      toasts.error('Erro ao carregar roles');
      console.error('Error loading roles:', err);
    }
  }

  async function loadMaps() {
    try {
      allMaps = await adminAPI.getMaps();
    } catch (err) {
      toasts.error('Erro ao carregar mapas');
      console.error('Error loading maps:', err);
    }
  }

  function validateForm() {
    errors = {
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    };

    let isValid = true;

    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Nome é obrigatório';
      isValid = false;
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
      isValid = false;
    }

    if (!formData.username || formData.username.trim() === '') {
      errors.username = 'Username é obrigatório';
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = 'Username deve ter pelo menos 3 caracteres';
      isValid = false;
    }

    if (!formData.password || formData.password.trim() === '') {
      errors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (formData.password.length < 3) {
      errors.password = 'Senha deve ter pelo menos 3 caracteres';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não conferem';
      isValid = false;
    }

    if (selectedRoles.length === 0) {
      toasts.warning('Selecione pelo menos uma role para o usuário');
      isValid = false;
    }

    return isValid;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    loading = true;
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        avatarUrl: formData.avatarUrl,
        telefone: formData.telefone,
        cpf: formData.cpf,
        departamento: formData.departamento,
        isActive: formData.isActive,
        defaultMap: formData.defaultMap,
        roleIds: selectedRoles,
      };

      const newUser = await adminAPI.createUser(userData);
      toasts.success('Usuário criado com sucesso!');
      setTimeout(() => push(`/admin/users/${newUser.id}`), 1500);
    } catch (err) {
      toasts.error(err.message || 'Erro ao criar usuário');
      console.error('Erro ao criar usuário:', err);
    } finally {
      loading = false;
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
    loadRoles();
    loadMaps();
  });
</script>

<AdminLayout title="Criar Usuário">
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
    </div>

    <!-- User Info Card -->
    <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
          <Icon name="user" size="w-6 h-6" className="text-[#5ce1e6]" />
          <h2 class="text-xl font-bold text-white">Informações do Usuário</h2>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Nome *</label>
              <input
                type="text"
                bind:value={formData.name}
                required
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid {errors.name ? 'rgba(239, 68, 68, 0.5)' : 'rgba(92, 225, 230, 0.15)'};" />
              {#if errors.name}
                <p class="text-red-400 text-xs mt-1">{errors.name}</p>
              {/if}
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Username *</label>
              <input
                type="text"
                bind:value={formData.username}
                required
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid {errors.username ? 'rgba(239, 68, 68, 0.5)' : 'rgba(92, 225, 230, 0.15)'};" />
              {#if errors.username}
                <p class="text-red-400 text-xs mt-1">{errors.username}</p>
              {/if}
            </div>
          </div>

          <div>
            <label class="block text-white/70 text-sm font-semibold mb-2">Email *</label>
            <input
              type="email"
              bind:value={formData.email}
              required
              class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
              style="background: rgba(26, 31, 53, 0.6); border: 1px solid {errors.email ? 'rgba(239, 68, 68, 0.5)' : 'rgba(92, 225, 230, 0.15)'};" />
            {#if errors.email}
              <p class="text-red-400 text-xs mt-1">{errors.email}</p>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Senha *</label>
              <input
                type="password"
                bind:value={formData.password}
                required
                minlength="3"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid {errors.password ? 'rgba(239, 68, 68, 0.5)' : 'rgba(92, 225, 230, 0.15)'};" />
              {#if errors.password}
                <p class="text-red-400 text-xs mt-1">{errors.password}</p>
              {/if}
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Confirmar Senha *</label>
              <input
                type="password"
                bind:value={formData.confirmPassword}
                required
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid {errors.confirmPassword ? 'rgba(239, 68, 68, 0.5)' : 'rgba(92, 225, 230, 0.15)'};" />
              {#if errors.confirmPassword}
                <p class="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
              {/if}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Telefone</label>
              <input
                type="tel"
                bind:value={formData.telefone}
                placeholder="(00) 00000-0000"
                maxlength="20"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">CPF</label>
              <input
                type="text"
                bind:value={formData.cpf}
                placeholder="000.000.000-00"
                maxlength="14"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Departamento</label>
              <input
                type="text"
                bind:value={formData.departamento}
                placeholder="Ex: TI, RH, Financeiro"
                maxlength="100"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Avatar URL</label>
              <input
                type="url"
                bind:value={formData.avatarUrl}
                placeholder="https://exemplo.com/avatar.png"
                maxlength="500"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>
          </div>

          <div>
            <label class="block text-white/70 text-sm font-semibold mb-2">Mapa Padrão</label>
            <select
              bind:value={formData.defaultMap}
              class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
              style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);">
              <option value="">Selecione um mapa</option>
              {#each allMaps.filter(m => m.isActive) as map}
                <option value={map.name}>{map.displayName}</option>
              {/each}
            </select>
            {#if allMaps.length === 0}
              <p class="text-yellow-300 text-xs mt-1">⚠️ Nenhum mapa cadastrado. Crie mapas na seção de gerenciamento.</p>
            {/if}
          </div>

          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              bind:checked={formData.isActive}
              class="w-5 h-5 rounded"
              style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.3);" />
            <label class="text-white/70 text-sm font-medium">Conta Ativa</label>
          </div>

          <!-- Roles Selection -->
          <div class="pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
            <div class="flex items-center gap-3 mb-4">
              <Icon name="roles" size="w-5 h-5" className="text-[#5ce1e6]" />
              <h3 class="text-lg font-bold text-white">Roles & Permissões *</h3>
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
          </div>

          <div class="flex gap-3 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
            <button
              type="submit"
              disabled={loading}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background: #5ce1e6; color: #0f1419;">
              {loading ? 'Criando...' : 'Criar Usuário'}
            </button>
            <button
              type="button"
              on:click={() => push('/admin/users')}
              disabled={loading}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</AdminLayout>
