// lib/utils/auth-context.ts

export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
} 