import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// TODO: 本番環境では実際のAPI認証に切り替える
const USE_MOCK_AUTH = true;

// User type
export interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'EDITOR';
  name: string | null;
  avatarUrl?: string | null;
}

// Mock user for development
const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'owner@example.com',
  role: 'OWNER',
  name: 'オーナー',
  avatarUrl: null,
};

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (USE_MOCK_AUTH) {
        // Check if mock user was logged in
        const mockLoggedIn = localStorage.getItem('mock_logged_in');
        if (mockLoggedIn === 'true') {
          setUser(MOCK_USER);
        }
        setIsLoading(false);
        return;
      }

      // Real auth logic (disabled for now)
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (_email: string, _password: string) => {
    if (USE_MOCK_AUTH) {
      // Mock login - always succeed
      localStorage.setItem('mock_logged_in', 'true');
      setUser(MOCK_USER);
      return;
    }

    // Real auth logic would go here
  }, []);

  // Logout
  const logout = useCallback(async () => {
    if (USE_MOCK_AUTH) {
      localStorage.removeItem('mock_logged_in');
      setUser(null);
      return;
    }

    // Real auth logic would go here
    setUser(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (USE_MOCK_AUTH) {
      // Mock refresh - just keep the current user
      const mockLoggedIn = localStorage.getItem('mock_logged_in');
      if (mockLoggedIn === 'true') {
        setUser(MOCK_USER);
      }
      return;
    }

    // Real auth logic would go here
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
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
