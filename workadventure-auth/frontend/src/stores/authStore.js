import { writable } from 'svelte/store';

function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  });

  return {
    subscribe,
    setUser: (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isAdmin: user?.tags?.includes('admin') || user?.tags?.includes('super_admin') || false,
      });
    },
    logout: () => {
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    },
  };
}

export const authStore = createAuthStore();
