import { writable } from 'svelte/store';
import { apiRequest } from '../utils/api';

function createUserStore() {
  const { subscribe, set, update } = writable({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
  });

  return {
    subscribe,

    /**
     * Carrega os dados do usuário logado do backend
     */
    async loadCurrentUser() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
        });
        return false;
      }

      update((state) => ({ ...state, isLoading: true }));

      try {
        const userData = await apiRequest('/admin/me');

        set({
          user: userData,
          isAuthenticated: true,
          isAdmin: userData.tags?.includes('admin') || userData.tags?.includes('super_admin') || false,
          isLoading: false,
        });

        // Atualizar localStorage com dados completos
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('isAdmin', userData.tags?.includes('admin') ? 'true' : 'false');

        return true;
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
        });
        return false;
      }
    },

    /**
     * Define o usuário no store (usado após login)
     */
    setUser(userData) {
      set({
        user: userData,
        isAuthenticated: true,
        isAdmin: userData.tags?.includes('admin') || userData.tags?.includes('super_admin') || false,
        isLoading: false,
      });

      // Salvar no localStorage
      localStorage.setItem('userId', userData.userId || userData.id);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('isAdmin', userData.isAdmin || userData.tags?.includes('admin') ? 'true' : 'false');
    },

    /**
     * Atualiza dados do usuário (após edição de perfil)
     */
    updateUser(updatedData) {
      update((state) => ({
        ...state,
        user: {
          ...state.user,
          ...updatedData,
        },
      }));

      // Atualizar localStorage
      if (updatedData.email) {
        localStorage.setItem('userEmail', updatedData.email);
      }
      if (updatedData.name) {
        localStorage.setItem('userName', updatedData.name);
      }
    },

    /**
     * Limpa o store e faz logout
     */
    logout() {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });

      // Limpar localStorage
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('isAdmin');
    },

    /**
     * Verifica se há um usuário autenticado
     */
    checkAuth() {
      const userId = localStorage.getItem('userId');
      return !!userId;
    },
  };
}

export const userStore = createUserStore();
