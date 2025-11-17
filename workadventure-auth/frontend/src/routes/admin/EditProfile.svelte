<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { userStore } from '../../stores/userStore';
  import { toasts } from '../../stores/toast.js';
  import { adminAPI } from '../../utils/api';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';

  let formData = {
    name: '',
    email: '',
    username: '',
    avatarUrl: '',
    telefone: '',
    departamento: '',
    password: '',
    confirmPassword: '',
  };

  let originalData = {};
  let isLoading = true;
  let isSaving = false;
  let showPasswordFields = false;

  onMount(async () => {
    // Carregar dados do usuário
    if (!$userStore.user) {
      const success = await userStore.loadCurrentUser();
      if (!success) {
        push('/admin/login');
        return;
      }
    }

    const user = $userStore.user;
    formData = {
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      avatarUrl: user.avatarUrl || '',
      telefone: user.telefone || '',
      departamento: user.departamento || '',
      password: '',
      confirmPassword: '',
    };

    originalData = { ...formData };
    isLoading = false;
  });

  async function handleSubmit(event) {
    event.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toasts.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toasts.error('Email é obrigatório');
      return;
    }

    if (!formData.username.trim()) {
      toasts.error('Username é obrigatório');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toasts.error('Email inválido');
      return;
    }

    // Validar senha se fornecida
    if (formData.password) {
      if (formData.password.length < 6) {
        toasts.error('A senha deve ter no mínimo 6 caracteres');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toasts.error('As senhas não coincidem');
        return;
      }
    }

    isSaving = true;

    try {
      // Preparar dados para envio (remover campos vazios e confirmPassword)
      const updateData = {};

      if (formData.name !== originalData.name) updateData.name = formData.name;
      if (formData.email !== originalData.email) updateData.email = formData.email;
      if (formData.username !== originalData.username) updateData.username = formData.username;
      if (formData.avatarUrl !== originalData.avatarUrl) updateData.avatarUrl = formData.avatarUrl || null;
      if (formData.telefone !== originalData.telefone) updateData.telefone = formData.telefone || null;
      if (formData.departamento !== originalData.departamento) updateData.departamento = formData.departamento || null;
      if (formData.password) updateData.password = formData.password;

      // Verificar se há alterações
      if (Object.keys(updateData).length === 0) {
        toasts.info('Nenhuma alteração foi feita');
        isSaving = false;
        return;
      }

      const updatedUser = await adminAPI.updateCurrentUser(updateData);

      // Atualizar userStore
      userStore.updateUser(updatedUser);

      toasts.success('Perfil atualizado com sucesso!');

      // Recarregar dados do usuário
      await userStore.loadCurrentUser();

      // Redirecionar para página de visualização
      setTimeout(() => {
        push('/admin/profile');
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toasts.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    push('/admin/profile');
  }

  function togglePasswordFields() {
    showPasswordFields = !showPasswordFields;
    if (!showPasswordFields) {
      formData.password = '';
      formData.confirmPassword = '';
    }
  }
</script>

<AdminLayout title="Editar Perfil">
  {#if isLoading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando...</p>
      </div>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto">
      <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
        <div class="p-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="user" size="w-8 h-8" className="text-[#5ce1e6]" />
              <h2 class="text-3xl font-bold text-white">Editar Informações do Perfil</h2>
            </div>
            <p class="text-white/60 text-base">Atualize suas informações pessoais e preferências</p>
          </div>

          <form on:submit={handleSubmit}>
            <!-- Informações Básicas -->
            <div class="mb-8 pb-8" style="border-bottom: 1px solid rgba(92, 225, 230, 0.1);">
              <div class="flex items-center gap-3 mb-6">
                <Icon name="user" size="w-6 h-6" className="text-[#5ce1e6]" />
                <h3 class="text-xl font-bold text-white">Informações Básicas</h3>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    bind:value={formData.name}
                    placeholder="Digite seu nome completo"
                    required
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                  />
                </div>

                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    bind:value={formData.username}
                    placeholder="Digite seu username"
                    required
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  bind:value={formData.email}
                  placeholder="Digite seu email"
                  required
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                />
              </div>
            </div>

            <!-- Informações de Contato -->
            <div class="mb-8 pb-8" style="border-bottom: 1px solid rgba(92, 225, 230, 0.1);">
              <div class="flex items-center gap-3 mb-6">
                <Icon name="mail" size="w-6 h-6" className="text-[#5ce1e6]" />
                <h3 class="text-xl font-bold text-white">Informações de Contato</h3>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    bind:value={formData.telefone}
                    placeholder="(00) 00000-0000"
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                  />
                </div>

                <div>
                  <label class="block text-white/70 text-sm font-semibold mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    bind:value={formData.departamento}
                    placeholder="Digite seu departamento"
                    class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                    style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                  />
                </div>
              </div>
            </div>

            <!-- Avatar -->
            <div class="mb-8 pb-8" style="border-bottom: 1px solid rgba(92, 225, 230, 0.1);">
              <div class="flex items-center gap-3 mb-6">
                <Icon name="image" size="w-6 h-6" className="text-[#5ce1e6]" />
                <h3 class="text-xl font-bold text-white">Avatar</h3>
              </div>
              
              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">
                  URL do Avatar
                </label>
                <input
                  type="url"
                  bind:value={formData.avatarUrl}
                  placeholder="https://exemplo.com/avatar.jpg"
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                />
                <span class="text-white/40 text-xs italic mt-2 block">Deixe em branco para usar o avatar gerado automaticamente</span>
              </div>
            </div>

            <!-- Alterar Senha -->
            <div class="mb-8">
              <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-3">
                  <Icon name="lock" size="w-6 h-6" className="text-[#5ce1e6]" />
                  <h3 class="text-xl font-bold text-white">Alterar Senha</h3>
                </div>
                <button
                  type="button"
                  on:click={togglePasswordFields}
                  class="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                  {showPasswordFields ? 'Cancelar alteração de senha' : 'Alterar senha'}
                </button>
              </div>

              {#if showPasswordFields}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-white/70 text-sm font-semibold mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      bind:value={formData.password}
                      placeholder="Mínimo 6 caracteres"
                      minlength="6"
                      class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                      style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                    />
                  </div>

                  <div>
                    <label class="block text-white/70 text-sm font-semibold mb-2">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      bind:value={formData.confirmPassword}
                      placeholder="Digite a senha novamente"
                      minlength="6"
                      class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                      style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Ações -->
            <div class="flex gap-3 pt-6" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
              <button
                type="button"
                on:click={handleCancel}
                disabled={isSaving}
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                <div class="flex items-center justify-center gap-2">
                  <Icon name="x" size="w-5 h-5" />
                  Cancelar
                </div>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: #5ce1e6; color: #0f1419;">
                {#if isSaving}
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-5 h-5 border-2 border-[#0f1419]/30 border-t-[#0f1419] rounded-full animate-spin"></div>
                    Salvando...
                  </div>
                {:else}
                  <div class="flex items-center justify-center gap-2">
                    <Icon name="check" size="w-5 h-5" />
                    Salvar Alterações
                  </div>
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>