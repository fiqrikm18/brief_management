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
const USER_STORAGE_KEY = "fugo_user";

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

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return false;
  }
  return Date.now() >= payload.exp * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const storedToken = getCookie(TOKEN_STORAGE_KEY);
        const storedUser = getCookie(USER_STORAGE_KEY);

        if (storedToken && storedUser) {
          if (isTokenExpired(storedToken)) {
            removeCookie(TOKEN_STORAGE_KEY);
            removeCookie(USER_STORAGE_KEY);
            setAccessToken(null);
            setAuthHeader(null);
            setUser(null);
            setIsLoading(false);
            return;
          }

          setAccessToken(storedToken);
          setAuthHeader(storedToken);
          setUser(JSON.parse(storedUser) as User);
        } else {
          setAccessToken(null);
          setAuthHeader(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
        removeCookie(TOKEN_STORAGE_KEY);
        removeCookie(USER_STORAGE_KEY);
        setAccessToken(null);
        setAuthHeader(null);
        setUser(null);
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

      setCookie(TOKEN_STORAGE_KEY, data.accessToken);
      setCookie(USER_STORAGE_KEY, JSON.stringify(data.user));
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
      removeCookie(TOKEN_STORAGE_KEY);
      removeCookie(USER_STORAGE_KEY);
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
