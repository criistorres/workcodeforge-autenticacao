<script>
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import Icon from '../../components/Icon.svelte';
  import { adminAPI } from '../../utils/api.js';

  let maps = [];
  let loading = true;
  let error = '';
  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedMap = null;

  let formData = {
    name: '',
    displayName: '',
    description: '',
    mapUrl: '',
    isActive: true,
  };

  async function loadMaps() {
    loading = true;
    try {
      maps = await adminAPI.getMaps();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    formData = {
      name: '',
      displayName: '',
      description: '',
      mapUrl: '',
      isActive: true,
    };
    showCreateModal = true;
  }

  function openEditModal(map) {
    selectedMap = map;
    formData = {
      name: map.name,
      displayName: map.displayName,
      description: map.description || '',
      mapUrl: map.mapUrl || '',
      isActive: map.isActive,
    };
    showEditModal = true;
  }

  function openDeleteModal(map) {
    selectedMap = map;
    showDeleteModal = true;
  }

  async function handleCreate() {
    try {
      await adminAPI.createMap(formData);
      showCreateModal = false;
      await loadMaps();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleUpdate() {
    try {
      await adminAPI.updateMap(selectedMap.id, formData);
      showEditModal = false;
      await loadMaps();
    } catch (err) {
      error = err.message;
    }
  }

  async function handleDelete() {
    try {
      await adminAPI.deleteMap(selectedMap.id);
      showDeleteModal = false;
      await loadMaps();
    } catch (err) {
      error = err.message;
    }
  }

  onMount(() => {
    loadMaps();
  });
</script>

<AdminLayout title="Gerenciar Mapas">
  <div class="max-w-7xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <Icon name="map" size="w-8 h-8" className="text-[#5ce1e6]" />
        <h1 class="text-2xl font-bold text-white">Mapas</h1>
      </div>

      <button
        on:click={openCreateModal}
        class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
        style="background: #5ce1e6; color: #0f1419;">
        <Icon name="plus" size="w-5 h-5" />
        Novo Mapa
      </button>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-[#5ce1e6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-white/60 font-medium" style="font-size: 14px;">Carregando mapas...</p>
        </div>
      </div>
    {:else if error}
      <div class="p-6 rounded-lg" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
        <div class="flex items-center gap-3">
          <Icon name="ban" size="w-6 h-6" className="text-red-400" />
          <span class="text-red-300 font-semibold" style="font-size: 14px;">{error}</span>
        </div>
      </div>
    {:else if maps.length === 0}
      <div class="text-center py-20">
        <Icon name="map" size="w-20 h-20" className="text-white/20 mx-auto mb-4" />
        <p class="text-white/50 text-lg font-medium mb-2">Nenhum mapa cadastrado</p>
        <p class="text-white/30 text-sm mb-6">Crie o primeiro mapa para começar</p>
        <button
          on:click={openCreateModal}
          class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
          style="background: #5ce1e6; color: #0f1419;">
          <Icon name="plus" size="w-5 h-5" />
          Criar Primeiro Mapa
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each maps as map}
          <div class="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(21, 26, 46, 0.6) 100%); border: 1px solid rgba(92, 225, 230, 0.15); backdrop-filter: blur(10px);">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-white mb-1">{map.displayName}</h3>
                  <p class="text-[#5ce1e6] text-sm font-mono">{map.name}</p>
                </div>
                <div>
                  {#if map.isActive}
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold" style="background: rgba(34, 197, 94, 0.1); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3);">
                      <Icon name="check-circle" size="w-3 h-3" />
                      Ativo
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold" style="background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255, 255, 255, 0.15);">
                      Inativo
                    </span>
                  {/if}
                </div>
              </div>

              {#if map.description}
                <p class="text-white/60 text-sm mb-4 line-clamp-2">{map.description}</p>
              {/if}

              {#if map.mapUrl}
                <div class="mb-4 p-3 rounded-lg" style="background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.1);">
                  <p class="text-white/50 text-xs mb-1">URL do Mapa</p>
                  <p class="text-white text-sm font-mono truncate">{map.mapUrl}</p>
                </div>
              {/if}

              <div class="flex gap-2 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
                <button
                  on:click={() => openEditModal(map)}
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: rgba(59, 130, 246, 0.1); color: rgb(96, 165, 250); border: 1px solid rgba(59, 130, 246, 0.3);">
                  <Icon name="list" size="w-4 h-4" />
                  Editar
                </button>
                <button
                  on:click={() => openDeleteModal(map)}
                  class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style="background: rgba(239, 68, 68, 0.1); color: rgb(252, 165, 165); border: 1px solid rgba(239, 68, 68, 0.3);">
                  <Icon name="ban" size="w-4 h-4" />
                  Deletar
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Create Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 20, 25, 0.8); backdrop-filter: blur(8px);">
      <div class="w-full max-w-2xl rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.95) 0%, rgba(21, 26, 46, 0.95) 100%); border: 1px solid rgba(92, 225, 230, 0.15);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="plus" size="w-6 h-6" className="text-[#5ce1e6]" />
            <h3 class="text-xl font-bold text-white">Criar Novo Mapa</h3>
          </div>

          <form on:submit|preventDefault={handleCreate} class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Nome (ID)</label>
                <input
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="ex: filial-sp"
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens"
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
                <p class="text-white/40 text-xs mt-1">Usado como identificador único</p>
              </div>

              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Nome de Exibição</label>
                <input
                  type="text"
                  bind:value={formData.displayName}
                  required
                  placeholder="ex: Filial São Paulo"
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
              </div>
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Descrição</label>
              <textarea
                bind:value={formData.description}
                rows="3"
                placeholder="Descrição do mapa..."
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none resize-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"></textarea>
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">URL do Mapa</label>
              <input
                type="url"
                bind:value={formData.mapUrl}
                placeholder="https://maps.workadventure.localhost/..."
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>

            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                bind:checked={formData.isActive}
                class="w-5 h-5 rounded"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.3);" />
              <label class="text-white/70 text-sm font-medium">Mapa Ativo</label>
            </div>

            <div class="flex gap-3 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
              <button
                type="submit"
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style="background: #5ce1e6; color: #0f1419;">
                Criar Mapa
              </button>
              <button
                type="button"
                on:click={() => showCreateModal = false}
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit Modal -->
  {#if showEditModal && selectedMap}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 20, 25, 0.8); backdrop-filter: blur(8px);">
      <div class="w-full max-w-2xl rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.95) 0%, rgba(21, 26, 46, 0.95) 100%); border: 1px solid rgba(92, 225, 230, 0.15);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="list" size="w-6 h-6" className="text-[#5ce1e6]" />
            <h3 class="text-xl font-bold text-white">Editar Mapa</h3>
          </div>

          <form on:submit|preventDefault={handleUpdate} class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Nome (ID)</label>
                <input
                  type="text"
                  bind:value={formData.name}
                  required
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens"
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
              </div>

              <div>
                <label class="block text-white/70 text-sm font-semibold mb-2">Nome de Exibição</label>
                <input
                  type="text"
                  bind:value={formData.displayName}
                  required
                  class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                  style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
              </div>
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">Descrição</label>
              <textarea
                bind:value={formData.description}
                rows="3"
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none resize-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);"></textarea>
            </div>

            <div>
              <label class="block text-white/70 text-sm font-semibold mb-2">URL do Mapa</label>
              <input
                type="url"
                bind:value={formData.mapUrl}
                class="w-full px-4 py-3 rounded-lg text-white text-sm focus:outline-none transition-all duration-200"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.15);" />
            </div>

            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                bind:checked={formData.isActive}
                class="w-5 h-5 rounded"
                style="background: rgba(26, 31, 53, 0.6); border: 1px solid rgba(92, 225, 230, 0.3);" />
              <label class="text-white/70 text-sm font-medium">Mapa Ativo</label>
            </div>

            <div class="flex gap-3 pt-4" style="border-top: 1px solid rgba(92, 225, 230, 0.1);">
              <button
                type="submit"
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style="background: #5ce1e6; color: #0f1419;">
                Salvar Alterações
              </button>
              <button
                type="button"
                on:click={() => showEditModal = false}
                class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Modal -->
  {#if showDeleteModal && selectedMap}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(15, 20, 25, 0.8); backdrop-filter: blur(8px);">
      <div class="w-full max-w-md rounded-xl" style="background: linear-gradient(135deg, rgba(26, 31, 53, 0.95) 0%, rgba(21, 26, 46, 0.95) 100%); border: 1px solid rgba(239, 68, 68, 0.3);">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <Icon name="ban" size="w-6 h-6" className="text-red-400" />
            <h3 class="text-xl font-bold text-white">Deletar Mapa</h3>
          </div>

          <p class="text-white/70 mb-2 leading-relaxed">
            Tem certeza que deseja deletar o mapa <strong class="text-white">{selectedMap.displayName}</strong>?
          </p>
          <p class="text-white/50 text-sm mb-6">
            Esta ação não pode ser desfeita. Usuários que utilizam este mapa como padrão precisarão ser reconfigurados.
          </p>

          <div class="flex gap-3">
            <button
              on:click={handleDelete}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgb(239, 68, 68); color: white;">
              Deletar
            </button>
            <button
              on:click={() => showDeleteModal = false}
              class="flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style="background: rgba(92, 225, 230, 0.1); color: #5ce1e6; border: 1px solid rgba(92, 225, 230, 0.2);">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</AdminLayout>
