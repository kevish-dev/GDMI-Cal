import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase.js';
import { createUser, getDocuments } from '../services/firestore.js';
import { where } from 'firebase/firestore';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize default admin user if it doesn't exist
  const initializeDefaultAdmin = async () => {
    try {
      const existingUsers = await getDocuments('users', [where('username', '==', 'admin')]);
      
      if (existingUsers.length === 0) {
        await createUser({
          username: 'admin',
          password: 'admin123', // In production, this should be hashed
          displayName: 'Administrator',
          role: 'admin'
        });
        console.log('Default admin user created');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  };

  useEffect(() => {
    const loadUserSession = async () => {
      // Check if user is logged in on app start
      const savedAuth = localStorage.getItem('gdmi_auth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          setUser(authData);
          setIsAuthenticated(true);
          setIsAdmin(authData.role === 'admin');
        } catch (error) {
          console.error('Error loading saved auth:', error);
          localStorage.removeItem('gdmi_auth');
        }
      }
      
      // Initialize default admin user
      await initializeDefaultAdmin();
      setLoading(false);
    };

    loadUserSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get user by username from Firestore
      const users = await getDocuments('users', [where('username', '==', username)]);
      
      if (users.length === 0) {
        return false;
      }
      
      const userData = users[0];
      
      // Simple password check (in production, use proper hashing)
      if (userData.password !== password) {
        return false;
      }
      
      // Create auth user object (without password)
      const authUser: AuthUser = {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        role: userData.role
      };
      
      setUser(authUser);
      setIsAuthenticated(true);
      setIsAdmin(userData.role === 'admin');
      
      // Save to localStorage
      localStorage.setItem('gdmi_auth', JSON.stringify(authUser));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Check if username already exists
      const existingUsers = await getDocuments('users', [where('username', '==', username)]);
      
      if (existingUsers.length > 0) {
        throw new Error('Username already exists');
      }
      
      // Create new user with minimal data
      const newUser = await createUser({
        username,
        password, // In production, hash this password
        displayName: username, // Use username as display name
        role: 'user' // Default role
      });
      
      // Create auth user object (without password)
      const authUser: AuthUser = {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role
      };
      
      setUser(authUser);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      // Save to localStorage
      localStorage.setItem('gdmi_auth', JSON.stringify(authUser));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('gdmi_auth');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isAdmin, 
      login, 
      register, 
      logout, 
      user, 
      loading 
    }}>
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