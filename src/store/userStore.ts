import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'robot-qc-auth-user';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
  roles?: string[];
}

function readUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.role !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveUserToStorage(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

interface UserState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  hydrateFromStorage: () => AuthUser | null;
}

export const useUserStore = create<UserState>((set) => ({
  user: readUserFromStorage(),
  setUser: (user) => {
    saveUserToStorage(user);
    set({ user });
  },
  clearUser: () => {
    saveUserToStorage(null);
    set({ user: null });
  },
  hydrateFromStorage: () => {
    const user = readUserFromStorage();
    set({ user });
    return user;
  },
}));
