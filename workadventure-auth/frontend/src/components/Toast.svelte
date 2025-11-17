<script>
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Icon from './Icon.svelte';
  import { toasts } from '../stores/toast.js';

  export let id;
  export let message;
  export let type = 'info';

  const typeConfig = {
    success: {
      icon: 'check-circle',
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: 'rgb(134, 239, 172)',
      iconColor: 'text-green-400'
    },
    error: {
      icon: 'ban',
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: 'rgb(252, 165, 165)',
      iconColor: 'text-red-400'
    },
    warning: {
      icon: 'ban',
      bg: 'rgba(234, 179, 8, 0.1)',
      border: 'rgba(234, 179, 8, 0.4)',
      text: 'rgb(250, 204, 21)',
      iconColor: 'text-yellow-400'
    },
    info: {
      icon: 'user',
      bg: 'rgba(92, 225, 230, 0.1)',
      border: 'rgba(92, 225, 230, 0.4)',
      text: '#5ce1e6',
      iconColor: 'text-[#5ce1e6]'
    }
  };

  $: config = typeConfig[type] || typeConfig.info;

  function close() {
    toasts.remove(id);
  }
</script>

<div
  role="alert"
  class="toast-item flex items-center gap-3 p-4 rounded-lg shadow-2xl min-w-[320px] max-w-[420px] backdrop-blur-sm"
  style="background: {config.bg}; border: 1px solid {config.border};"
  in:fly={{ x: 400, duration: 400, easing: quintOut }}
  out:fade={{ duration: 200 }}
>
  <Icon name={config.icon} size="w-5 h-5" className={config.iconColor} />

  <p class="flex-1 text-sm font-medium" style="color: {config.text};">
    {message}
  </p>

  <button
    on:click={close}
    class="opacity-60 hover:opacity-100 transition-opacity duration-200"
    aria-label="Fechar"
  >
    <Icon name="x-circle" size="w-4 h-4" className={config.iconColor} />
  </button>
</div>

<style>
  .toast-item {
    animation: glow 2s ease-in-out infinite alternate;
  }

  @keyframes glow {
    from {
      box-shadow: 0 0 5px rgba(92, 225, 230, 0.2), 0 0 10px rgba(92, 225, 230, 0.1);
    }
    to {
      box-shadow: 0 0 10px rgba(92, 225, 230, 0.3), 0 0 20px rgba(92, 225, 230, 0.15);
    }
  }
</style>
