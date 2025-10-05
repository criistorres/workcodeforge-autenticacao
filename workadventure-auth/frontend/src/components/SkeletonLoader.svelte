<script>
  export let rows = 5;
  export let type = 'table'; // 'table', 'card', 'stat'
</script>

{#if type === 'table'}
  <div class="space-y-3">
    {#each Array(rows) as _, i}
      <div class="bg-gray-800/50 rounded-lg p-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-700 rounded-lg"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-700 rounded w-3/4"></div>
            <div class="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div class="w-24 h-8 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if type === 'card'}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each Array(rows) as _, i}
      <div class="bg-gray-800/50 rounded-xl p-6 animate-pulse">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gray-700 rounded-xl"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-700 rounded w-3/4"></div>
            <div class="h-6 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 bg-gray-700 rounded w-full"></div>
          <div class="h-3 bg-gray-700 rounded w-4/5"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if type === 'stat'}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
    {#each Array(rows) as _, i}
      <div class="bg-gray-800/50 rounded-2xl p-6 animate-pulse">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-gray-700 rounded-xl"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-gray-700 rounded w-3/4"></div>
            <div class="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div class="h-3 bg-gray-700 rounded w-full"></div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
