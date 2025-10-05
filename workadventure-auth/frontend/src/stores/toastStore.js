import { writable } from 'svelte/store';

export const toasts = writable([]);

let nextId = 0;

export function addToast(message, type = 'info', duration = 3000) {
  const id = nextId++;
  const toast = { id, message, type };

  toasts.update(t => [...t, toast]);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id) {
  toasts.update(t => t.filter(toast => toast.id !== id));
}

// Helper functions
export const toast = {
  success: (message, duration) => addToast(message, 'success', duration),
  error: (message, duration) => addToast(message, 'error', duration),
  warning: (message, duration) => addToast(message, 'warning', duration),
  info: (message, duration) => addToast(message, 'info', duration),
};
