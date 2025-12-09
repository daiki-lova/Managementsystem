import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, tokenManager, ApiError } from './api';

// User type
export interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'EDITOR';
  name: string | null;
  avatarUrl?: string | null;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Load tokens from localStorage
      const { accessToken } = tokenManager.loadTokens();

      if (accessToken) {
        try {
          // Verify token and get user info
          const response = await authApi.me();
          if (response.success && response.data) {
            setUser({
              id: response.data.id,
              email: response.data.email,
              role: response.data.role as 'OWNER' | 'EDITOR',
              name: response.data.name,
              avatarUrl: response.data.avatarUrl,
            });
          }
        } catch {
          // Token invalid or expired, clear it
          tokenManager.clearTokens();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setError(null);

    try {
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        // Store tokens
        tokenManager.setTokens(
          response.data.session.accessToken,
          response.data.session.refreshToken
        );

        // Set user
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role as 'OWNER' | 'EDITOR',
          name: response.data.user.name,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('ログインに失敗しました');
      }
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      tokenManager.clearTokens();
      setUser(null);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    const { accessToken } = tokenManager.loadTokens();

    if (!accessToken) {
      setUser(null);
      return;
    }

    try {
      const response = await authApi.me();
      if (response.success && response.data) {
        setUser({
          id: response.data.id,
          email: response.data.email,
          role: response.data.role as 'OWNER' | 'EDITOR',
          name: response.data.name,
          avatarUrl: response.data.avatarUrl,
        });
      }
    } catch {
      tokenManager.clearTokens();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user is owner
export function useIsOwner() {
  const { user } = useAuth();
  return user?.role === 'OWNER';
}
