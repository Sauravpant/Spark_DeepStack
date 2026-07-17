import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { ApiUser, Shop } from '@/types';
import { TOKEN_KEY } from '@/constants/routes';

const USER_KEY = 'vyapar_user';
const SHOP_KEY = 'vyapar_shop';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: ApiUser | null;
  activeShop: Shop | null;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
  setActiveShop: (shop: Shop | null) => void;
  setUserProfile: (user: ApiUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<ApiUser | null>(() => parseStored<ApiUser>(USER_KEY));
  const [activeShop, setActiveShopState] = useState<Shop | null>(() => parseStored<Shop>(SHOP_KEY));

  const login = useCallback((newToken: string, newUser: ApiUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const setUserProfile = useCallback((newUser: ApiUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SHOP_KEY);
    setToken(null);
    setUser(null);
    setActiveShopState(null);
  }, []);

  const setActiveShop = useCallback((shop: Shop | null) => {
    if (shop) {
      localStorage.setItem(SHOP_KEY, JSON.stringify(shop));
    } else {
      localStorage.removeItem(SHOP_KEY);
    }
    setActiveShopState(shop);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        activeShop,
        login,
        logout,
        setActiveShop,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
