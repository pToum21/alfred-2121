// lib/utils/auth-provider.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Logger from './logging';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const login = (token: string) => {
    Logger.auth('[AuthProvider] Login successful');
    setIsAuthenticated(true);
  };

  const logout = () => {
    Logger.auth('[AuthProvider] Logging out');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 