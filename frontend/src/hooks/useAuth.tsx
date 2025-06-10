import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'restaurant';
  restaurant_id?: number;
}

interface AuthContextType {
  user: User | null;
  restaurant: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  restaurantLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restaurantLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;
  console.log('URL DE LA API',API_URL)

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.role === 'restaurant') {
          setRestaurant(data);
        } else {
          setUser(data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, [API_URL]); // importante para evitar warnings

const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const data = await response.json();
    setUser(data);
  };

  const restaurantLogin = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/restaurant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Credenciales inválidas');
  }

  const data = await response.json();
  setRestaurant(data);
};


  const logout = () => {
  fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    setUser(null);
  });
};

const restaurantLogout = () => {
  fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    setRestaurant(null);
  });
};


  const value = {
    user,
    restaurant,
    loading,
    login,
    restaurantLogin,
    logout,
    restaurantLogout
  };

  return (
    <AuthContext.Provider value={value}>
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
