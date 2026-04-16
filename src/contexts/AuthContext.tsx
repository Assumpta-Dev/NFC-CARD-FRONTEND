// ===========================================================
// AUTH CONTEXT
// ===========================================================
// React Context provides auth state (user, token, login/logout)
// to any component in the tree without prop drilling.
//
// Why Context (not Redux) for auth:
//   - Auth state is simple: user object + token
//   - It changes infrequently (login/logout events only)
//   - Context + localStorage covers 99% of auth use cases
//   - No need for Redux DevTools or time-travel for auth
//
// Token is stored in localStorage for persistence across page refreshes.
// For higher security, use HttpOnly cookies + refresh tokens.
// ===========================================================

// React removed from import — only named exports needed; react-jsx handles JSX transform
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Create context with undefined default — we check for it in useAuth()
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys as constants — prevents typos across the codebase
const TOKEN_KEY = "nfc_token";
const USER_KEY = "nfc_user";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // isLoading prevents a flash of unauthenticated UI on page refresh
  // while we read from localStorage
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state from localStorage on app startup
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Corrupted localStorage data — clear it and start fresh
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Called after successful login or registration.
   * Stores credentials in both state and localStorage.
   */
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  /**
   * Clears all auth state — called on logout or token expiry.
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume auth context.
 * Throws if used outside AuthProvider — catches configuration mistakes early.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return context;
}
