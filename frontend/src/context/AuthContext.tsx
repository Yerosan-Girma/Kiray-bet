import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { clearAuth, getToken } from '../api/axios';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, accessToken: string, rememberMe?: boolean) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'nesthub_user',
  TOKEN: 'nesthub_token',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Only attempt profile fetch if a token exists
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        // Backend: GET /auth/profile → { success, data: user }
        setUser(response.data);
      } catch {
        setUser(null);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User, accessToken: string, rememberMe = false) => {
    setUser(userData);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // continue regardless
    } finally {
      setUser(null);
      clearAuth();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      // Keep storage in sync
      if (localStorage.getItem(STORAGE_KEYS.USER)) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } else if (sessionStorage.getItem(STORAGE_KEYS.USER)) {
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
