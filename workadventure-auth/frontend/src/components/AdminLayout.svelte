<script>
  import Sidebar from './Sidebar.svelte';
  export let title = 'Admin Panel';
</script>

<div class="admin-layout" style="background: #0f1419; min-height: 100vh;">
  <!-- Subtle scanline effect -->
  <div class="absolute inset-0 pointer-events-none opacity-20" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(92, 225, 230, 0.03) 2px, rgba(92, 225, 230, 0.03) 4px);"></div>

  <Sidebar />

  <main class="content">
    <header style="background: linear-gradient(180deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(92, 225, 230, 0.1); padding: 1.5rem 2rem;">
      <div class="flex items-center justify-between">
        <h1 class="text-white font-bold" style="font-size: 24px; letter-spacing: 0.5px; font-family: 'Inter', sans-serif;">{title}</h1>
        <div class="flex items-center gap-3">
          <div class="px-3 py-1.5 rounded-lg" style="background: rgba(92, 225, 230, 0.1); border: 1px solid rgba(92, 225, 230, 0.2);">
            <span style="font-size: 11px; color: #5ce1e6; font-weight: 600; letter-spacing: 0.3px;">ADMIN</span>
          </div>
        </div>
      </div>
    </header>

    <div class="page-content" style="padding: 2rem;">
      <slot />
    </div>
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    position: relative;
  }

  .content {
    flex: 1;
    margin-left: 256px;
    display: flex;
    flex-direction: column;
  }

  .page-content {
    flex: 1;
  }
</style>
