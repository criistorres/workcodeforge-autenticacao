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
    background: #f5f7fa;
  }

  .content {
    flex: 1;
    margin-left: 250px;
    display: flex;
    flex-direction: column;
  }

  header {
    background: white;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .page-content {
    flex: 1;
    padding: 2rem;
  }
</style>
