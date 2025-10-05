<script>
  import { toasts, removeToast } from '../stores/toastStore.js';

  function getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  function getColors(type) {
    const colors = {
      success: 'from-green-600 to-emerald-600 border-green-500/50',
      error: 'from-red-600 to-orange-600 border-red-500/50',
      warning: 'from-yellow-600 to-orange-600 border-yellow-500/50',
      info: 'from-cyan-600 to-blue-600 border-cyan-500/50'
    };
    return colors[type] || colors.info;
  }
</script>

<div class="fixed top-4 right-4 z-50 space-y-3">
  {#each $toasts as toast (toast.id)}
    <div
      class="relative group transform transition-all duration-300 animate-slideIn"
    >
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r {getColors(toast.type)} rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>

      <!-- Toast content -->
      <div class="relative bg-gradient-to-r {getColors(toast.type)} border rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md">
        <div class="flex items-center gap-3">
          <div class="text-2xl">{getIcon(toast.type)}</div>
          <p class="text-white font-semibold flex-1">{toast.message}</p>
          <button
            on:click={() => removeToast(toast.id)}
            class="text-white/80 hover:text-white transition-colors ml-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
</style>
