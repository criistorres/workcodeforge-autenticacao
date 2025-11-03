<script>
  import Sidebar from './Sidebar.svelte';
  export let title = 'Admin Panel';
</script>

<div class="admin-layout">
  <Sidebar />

  <main class="content">
    <header>
      <h1>{title}</h1>
    </header>

    <div class="page-content">
      <slot />
    </div>
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: #1B1B29;
  }

  .content {
    flex: 1;
    margin-left: 250px;
    display: flex;
    flex-direction: column;
  }

  header {
    background: rgba(43, 39, 59, 0.6);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(86, 234, 255, 0.15);
    backdrop-filter: blur(10px);
  }

  header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #ffffff;
  }

  .page-content {
    flex: 1;
    padding: 2rem;
  }
</style>
