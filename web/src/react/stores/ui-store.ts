import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  openModal: (name: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  sidebarOpen: false,
  activeModal: null,
  modalData: null,
  toast: null,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (name, data) => set({ activeModal: name, modalData: data || null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (message, type = 'info') => {
    toastId++;
    set({ toast: { message, type, id: toastId } });
    setTimeout(() => {
      set((state) => (state.toast?.id === toastId ? { toast: null } : state));
    }, 4000);
  },

  dismissToast: () => set({ toast: null }),
}));
