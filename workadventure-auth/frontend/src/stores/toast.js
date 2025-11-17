import { writable } from 'svelte/store';

// Toast store
const { subscribe, update } = writable([]);

let nextId = 1;

export const toasts = {
  subscribe,

  add(message, type = 'info', duration = 4000) {
    const id = nextId++;
    const toast = { id, message, type, duration };

    update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  },

  remove(id) {
    update(toasts => toasts.filter(t => t.id !== id));
  },

  success(message, duration = 4000) {
    return this.add(message, 'success', duration);
  },

  error(message, duration = 5000) {
    return this.add(message, 'error', duration);
  },

  warning(message, duration = 4000) {
    return this.add(message, 'warning', duration);
  },

  info(message, duration = 4000) {
    return this.add(message, 'info', duration);
  },

  clear() {
    update(() => []);
  }
};

// Helper function para facilitar o uso
export function showToast(message, type = 'info', duration = 4000) {
  return toasts.add(message, type, duration);
}
