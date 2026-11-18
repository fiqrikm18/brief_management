import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api";
import type { User, LoginResponse } from "@/features/authentication/types/auth";

const TOKEN_STORAGE_KEY = "fugo_access_token";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedToken) {
          setAccessToken(storedToken);
          setAuthHeader(storedToken);
        }

        const { data } = await api.get<{ user: User }>("/auth/me");

        if (data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        setAccessToken(null);
        setAuthHeader(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
      setAccessToken(data.accessToken);
      setAuthHeader(data.accessToken);
      setUser(data.user);
    } catch {
      throw new Error("Invalid email or password");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Session is cleared locally regardless of the server response.
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAccessToken(null);
      setAuthHeader(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
