<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { userStore } from '../../stores/userStore';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';

  let user = null;
  let isLoading = true;

  onMount(async () => {
    // Carregar dados do usuário se necessário
    if (!$userStore.user) {
      const success = await userStore.loadCurrentUser();
      if (!success) {
        push('/admin/login');
        return;
      }
    }

    user = $userStore.user;
    isLoading = false;
  });

  function getAvatarUrl() {
    if (user?.avatarUrl) {
      return user.avatarUrl;
    }

    const name = user?.name || user?.email || 'U';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const colors = ['4F46E5', '7C3AED', 'EC4899', 'EF4444', 'F59E0B', '10B981', '06B6D4', '3B82F6'];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=256&background=${bgColor}&color=fff&bold=true&format=svg`;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleEditProfile() {
    push('/admin/profile/edit');
  }

  $: avatarUrl = user ? getAvatarUrl() : '';
</script>

<AdminLayout title="Meu Perfil">
  {#if isLoading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando perfil...</p>
      </div>
    </div>
  {:else if user}
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header com Avatar e Ações -->
      <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
        <div class="p-8">
          <div class="flex justify-between items-start flex-wrap gap-6">
            <div class="flex gap-6 items-center">
              <img 
                src={avatarUrl} 
                alt={user.name} 
                class="w-32 h-32 rounded-full object-cover" 
                style="border: 4px solid rgba(92, 225, 230, 0.3);" 
              />
              <div>
                <h2 class="text-3xl font-bold text-white mb-2">{user.name}</h2>
                <p class="text-[#5ce1e6] font-medium text-lg mb-3">@{user.username || user.email.split('@')[0]}</p>
                <div class="flex gap-2 flex-wrap">
                  {#if user.isActive}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                      <Icon name="check-circle" size="w-4 h-4" />
                      Ativo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border: 1px solid rgba(239, 68, 68, 0.3);">
                      <Icon name="ban" size="w-4 h-4" />
                      Inativo
                    </span>
                  {/if}
                  {#if user.tags?.includes('admin') || user.tags?.includes('super_admin')}
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(139, 92, 246, 0.1); color: rgb(196, 181, 253); border: 1px solid rgba(139, 92, 246, 0.3);">
                      <Icon name="shield" size="w-4 h-4" />
                      Administrador
                    </span>
                  {/if}
                </div>
              </div>
            </div>
            <button 
              on:click={handleEditProfile}
              class="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: #5ce1e6; color: #0f1419;">
              <Icon name="list" size="w-5 h-5" />
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Informações -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Informações de Contato -->
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="mail" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h3 class="text-xl font-bold text-white">Informações de Contato</h3>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email</p>
                <p class="text-white font-medium">{user.email}</p>
              </div>
              {#if user.telefone}
                <div>
                  <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Telefone</p>
                  <p class="text-white font-medium">{user.telefone}</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Informações Pessoais -->
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="user" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h3 class="text-xl font-bold text-white">Informações Pessoais</h3>
            </div>
            <div class="space-y-4">
              {#if user.cpf}
                <div>
                  <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">CPF</p>
                  <p class="text-white font-mono">{user.cpf}</p>
                </div>
              {/if}
              {#if user.departamento}
                <div>
                  <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Departamento</p>
                  <p class="text-white font-medium">{user.departamento}</p>
                </div>
              {/if}
              {#if user.defaultMap}
                <div>
                  <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Mapa Padrão</p>
                  <p class="text-white font-medium">{user.defaultMap}</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Informações da Conta -->
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="calendar" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h3 class="text-xl font-bold text-white">Informações da Conta</h3>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Conta criada</p>
                <p class="text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>
              {#if user.lastLogin}
                <div>
                  <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Último login</p>
                  <p class="text-white font-medium">{formatDate(user.lastLogin)}</p>
                </div>
              {/if}
              <div>
                <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email verificado</p>
                <p class="text-white font-medium">{user.isEmailVerified ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        {#if user.tags && user.tags.length > 0}
          <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
            <div class="p-6">
              <div class="flex items-center gap-3 mb-6">
                <Icon name="tag" size="w-6 h-6" className="text-[#5ce1e6]" />
                <h3 class="text-xl font-bold text-white">Tags</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each user.tags as tag}
                  <span class="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200" style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                    {tag}
                  </span>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Roles e Permissões -->
      {#if user.roles && user.roles.length > 0}
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="shield" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h3 class="text-xl font-bold text-white">Roles e Permissões</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each user.roles as role}
                <div class="p-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5" style="background: {role.color}20; border: 2px solid {role.color}60;">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: {role.color || '#4F46E5'};"></div>
                    <span class="font-bold text-white text-sm">{role.displayName || role.name}</span>
                  </div>
                  {#if role.description}
                    <p class="text-sm text-white/60 leading-relaxed">{role.description}</p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Sessões Ativas -->
      {#if user.sessions && user.sessions.length > 0}
        <div class="rounded-xl overflow-hidden" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-6">
              <Icon name="wifi" size="w-6 h-6" className="text-[#5ce1e6]" />
              <h3 class="text-xl font-bold text-white">Sessões Ativas ({user.sessions.length})</h3>
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
                        <span class="text-white ml-2">{formatDate(session.createdAt)}</span>
                      </div>
                    </div>
                    {#if session.isActive}
                      <span class="px-3 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                        Ativa
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex items-center justify-center py-20">
      <div class="p-6 rounded-lg" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
        <div class="flex items-center gap-3">
          <Icon name="ban" size="w-6 h-6" className="text-red-400" />
          <span class="text-red-300 font-semibold" style="font-size: 14px;">Erro ao carregar perfil</span>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>