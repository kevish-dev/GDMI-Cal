import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: { username: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials - in production, use proper authentication
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedAuth = localStorage.getItem('jewelry_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setIsAdmin(authData.role === 'admin');
      setUser(authData);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Demo authentication - replace with real auth in production
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      const userData = { username, role: 'admin' };
      setIsAuthenticated(true);
      setIsAdmin(true);
      setUser(userData);
      localStorage.setItem('jewelry_auth', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem('jewelry_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout, user }}>
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