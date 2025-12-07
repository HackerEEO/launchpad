import { create } from 'zustand';

interface AppStore {
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  currentUser: { wallet: string; email?: string } | null;
  setCurrentUser: (user: { wallet: string; email?: string } | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  currentUser: null,
  setCurrentUser: (currentUser) => set({ currentUser }),
}));
