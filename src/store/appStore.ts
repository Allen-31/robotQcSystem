import { create } from 'zustand';

interface AppUiState {
  isLaptop: boolean;
  pendingRequestCount: number;
  setIsLaptop: (isLaptop: boolean) => void;
  setPendingRequestCount: (count: number) => void;
}

export const useAppStore = create<AppUiState>((set) => ({
  isLaptop: false,
  pendingRequestCount: 0,
  setIsLaptop: (isLaptop) => set({ isLaptop }),
  setPendingRequestCount: (pendingRequestCount) => set({ pendingRequestCount }),
}));
