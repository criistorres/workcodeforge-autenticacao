<script>
  import { link } from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  export let isOpen = true;
</script>

<aside class="sidebar" class:collapsed={!isOpen}>
  <div class="logo">
    <h2>⚡ WorkCodeForge</h2>
    <p>Admin Panel</p>
  </div>

  <nav>
    <a href="/admin" use:link use:active>
      <span class="icon">📊</span>
      <span class="text">Dashboard</span>
    </a>

    <a href="/admin/users" use:link use:active>
      <span class="icon">👥</span>
      <span class="text">Usuários</span>
    </a>

    <a href="/admin/roles" use:link use:active>
      <span class="icon">🎭</span>
      <span class="text">Roles</span>
    </a>

    <a href="/admin/logs" use:link use:active>
      <span class="icon">📜</span>
      <span class="text">Auditoria</span>
    </a>
  </nav>

  <div class="footer">
    <a href="/" use:link>
      <span class="icon">🚪</span>
      <span class="text">Voltar ao Login</span>
    </a>
  </div>
</aside>

<style>
  .sidebar {
    width: 250px;
    height: 100vh;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    flex-direction: column;
    transition: width 0.3s;
    position: fixed;
    left: 0;
    top: 0;
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .logo {
    padding: 2rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .logo h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .logo p {
    margin: 0.5rem 0 0 0;
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .collapsed .logo p {
    display: none;
  }

  nav {
    flex: 1;
    padding: 1rem 0;
  }

  nav a {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.2s;
    gap: 1rem;
  }

  nav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  nav a:global(.active) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-left: 3px solid white;
  }

  .icon {
    font-size: 1.2rem;
    min-width: 20px;
  }

  .collapsed .text {
    display: none;
  }

  .footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 0;
  }

  .footer a {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: all 0.2s;
    gap: 1rem;
  }

  .footer a:hover {
    color: white;
  }
</style>
