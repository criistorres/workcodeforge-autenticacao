<script>
  import { toasts } from '../stores/toast.js';
  import Toast from './Toast.svelte';
</script>

<div class="toast-container fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div class="pointer-events-auto">
      <Toast id={toast.id} message={toast.message} type={toast.type} />
    </div>
  {/each}
</div>

<style>
  .toast-container {
    max-width: 90vw;
  }

  @media (max-width: 640px) {
    .toast-container {
      top: 1rem;
      right: 1rem;
      left: 1rem;
    }
  }
</style>
