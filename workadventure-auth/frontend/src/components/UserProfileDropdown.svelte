<script>
  import { userStore } from '../stores/userStore';
  import { push } from 'svelte-spa-router';
  import { showToast } from '../stores/toast';
  import { adminAPI } from '../utils/api';
  import { onMount, onDestroy } from 'svelte';

  let isOpen = false;
  let dropdownRef = null;
  let buttonRef = null;

  // Função para gerar URL do avatar usando ui-avatars.com
  function getAvatarUrl(user) {
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

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=128&background=${bgColor}&color=fff&bold=true&format=svg`;
  }

  function getPrimaryRole(user) {
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0].displayName || user.roles[0].name;
    }
    if (user?.tags?.includes('super_admin')) {
      return 'Super Administrador';
    }
    if (user?.tags?.includes('admin')) {
      return 'Administrador';
    }
    if (user?.tags?.includes('moderator')) {
      return 'Moderador';
    }
    return 'Usuário';
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  function handleViewProfile() {
    push('/admin/profile');
    closeDropdown();
  }

  function handleEditProfile() {
    push('/admin/profile/edit');
    closeDropdown();
  }

  async function handleLogout() {
    try {
      await adminAPI.logout();
      userStore.logout();
      showToast('Logout realizado com sucesso', 'success');
      push('/admin/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      userStore.logout();
      push('/admin/login');
    }
    closeDropdown();
  }

  // Fechar ao clicar fora
  function handleClickOutside(event) {
    if (dropdownRef && !dropdownRef.contains(event.target) &&
        buttonRef && !buttonRef.contains(event.target)) {
      closeDropdown();
    }
  }

  // Fechar com ESC
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closeDropdown();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeydown);
  });

  $: user = $userStore.user;
  $: avatarUrl = getAvatarUrl(user);
  $: primaryRole = getPrimaryRole(user);
</script>

<div class="user-profile-wrapper">
  <button
    bind:this={buttonRef}
    class="profile-button"
    on:click={toggleDropdown}
    class:active={isOpen}
    aria-label="Menu de perfil"
    aria-expanded={isOpen}
  >
    <img src={avatarUrl} alt={user?.name || 'Avatar'} class="avatar" />
    <div class="user-info">
      <span class="user-name">{user?.name || 'Usuário'}</span>
      <span class="user-role">{primaryRole}</span>
    </div>
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="var(--text-secondary)"
      viewBox="0 0 24 24"
      class="chevron"
      class:rotated={isOpen}
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownRef}
      class="dropdown-menu"
      role="menu"
    >
      <div class="dropdown-header">
        <img src={avatarUrl} alt={user?.name || 'Avatar'} class="dropdown-avatar" />
        <div class="dropdown-user-info">
          <span class="dropdown-user-name">{user?.name || 'Usuário'}</span>
          <span class="dropdown-user-email">{user?.email || ''}</span>
          <span class="dropdown-user-role">{primaryRole}</span>
        </div>
      </div>

      <div class="dropdown-divider"></div>

      <button class="dropdown-item" on:click={handleViewProfile} role="menuitem">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span>Ver Perfil</span>
      </button>

      <button class="dropdown-item" on:click={handleEditProfile} role="menuitem">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        <span>Editar Perfil</span>
      </button>

      <div class="dropdown-divider"></div>

      <button class="dropdown-item logout" on:click={handleLogout} role="menuitem">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
        <span>Sair</span>
      </button>
    </div>
  {/if}
</div>

<style>
  /* Variáveis CSS para tema */
  :root {
    --dropdown-bg: rgba(26, 31, 53, 0.98);
    --dropdown-border: rgba(92, 225, 230, 0.2);
    --dropdown-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --primary: #5ce1e6;
    --danger: #ef4444;
    --hover-bg: rgba(92, 225, 230, 0.1);
  }

  .user-profile-wrapper {
    position: relative;
    display: inline-block;
  }

  .profile-button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(26, 31, 53, 0.6);
    border: 1px solid rgba(92, 225, 230, 0.3);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .profile-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(92, 225, 230, 0.1), transparent);
    transition: left 0.5s;
  }

  .profile-button:hover::before {
    left: 100%;
  }

  .profile-button:hover,
  .profile-button.active {
    background: rgba(26, 31, 53, 0.9);
    border-color: #5ce1e6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(92, 225, 230, 0.3);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #5ce1e6;
    transition: transform 0.3s;
  }

  .profile-button:hover .avatar {
    transform: scale(1.05);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
  }

  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  .user-role {
    font-size: 12px;
    color: #5ce1e6;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  .chevron {
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  /* Dropdown Menu - PROFISSIONAL */
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    min-width: 320px;
    background: var(--dropdown-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--dropdown-border);
    border-radius: 16px;
    box-shadow: var(--dropdown-shadow);
    z-index: 99999; /* Z-index altíssimo para garantir que fique acima de tudo */
    overflow: hidden;
    animation: dropdownSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes dropdownSlideIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Seta do dropdown */
  .dropdown-menu::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 20px;
    width: 16px;
    height: 16px;
    background: var(--dropdown-bg);
    border-left: 1px solid var(--dropdown-border);
    border-top: 1px solid var(--dropdown-border);
    transform: rotate(45deg);
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
    border-bottom: 1px solid rgba(92, 225, 230, 0.2);
  }

  .dropdown-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #5ce1e6;
    box-shadow: 0 4px 12px rgba(92, 225, 230, 0.3);
  }

  .dropdown-user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .dropdown-user-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-user-email {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dropdown-user-role {
    font-size: 12px;
    color: #5ce1e6;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .dropdown-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(92, 225, 230, 0.3), transparent);
    margin: 4px 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .dropdown-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    height: 100%;
    background: #5ce1e6;
    transform: scaleY(0);
    transition: transform 0.2s;
  }

  .dropdown-item:hover::before {
    transform: scaleY(1);
  }

  .dropdown-item:hover {
    background: var(--hover-bg);
    padding-left: 24px;
  }

  .dropdown-item svg {
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .dropdown-item:hover svg {
    transform: translateX(2px);
  }

  .dropdown-item.logout {
    color: var(--danger);
  }

  .dropdown-item.logout:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .dropdown-item.logout::before {
    background: var(--danger);
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .user-info {
      display: none;
    }

    .profile-button {
      padding: 8px 12px;
    }

    .dropdown-menu {
      min-width: 280px;
      right: -10px;
    }

    .dropdown-menu::before {
      right: 30px;
    }
  }

  /* Animação de saída */
  @keyframes dropdownSlideOut {
    to {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
  }
</style>
