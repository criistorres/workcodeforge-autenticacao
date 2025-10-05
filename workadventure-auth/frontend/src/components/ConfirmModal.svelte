<script>
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title = 'Confirmar ação';
  export let message = 'Tem certeza que deseja continuar?';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancelar';
  export let type = 'danger'; // 'danger', 'warning', 'info'

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
    isOpen = false;
  }

  function handleCancel() {
    dispatch('cancel');
    isOpen = false;
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
    on:click={handleBackdropClick}
  >
    <div class="relative w-full max-w-md transform transition-all animate-scaleIn">
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-gradient-to-r {type === 'danger' ? 'from-red-500 to-orange-500' : type === 'warning' ? 'from-yellow-500 to-orange-500' : 'from-cyan-500 to-blue-500'} rounded-2xl blur-xl opacity-50"></div>

      <!-- Modal content -->
      <div class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border {type === 'danger' ? 'border-red-500/50' : type === 'warning' ? 'border-yellow-500/50' : 'border-cyan-500/50'} shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-6 border-b border-gray-700">
          <div class="flex items-center gap-3">
            <div class="text-4xl">
              {#if type === 'danger'}
                ⚠️
              {:else if type === 'warning'}
                🔔
              {:else}
                ℹ️
              {/if}
            </div>
            <h3 class="text-2xl font-bold text-white">{title}</h3>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6">
          <slot>
            <p class="text-gray-300 text-lg leading-relaxed">{message}</p>
          </slot>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-700 flex gap-4 justify-end">
          <button
            on:click={handleCancel}
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            {cancelText}
          </button>
          <button
            on:click={handleConfirm}
            class="px-6 py-3 bg-gradient-to-r {type === 'danger' ? 'from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500' : type === 'warning' ? 'from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500' : 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'} text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
</style>
