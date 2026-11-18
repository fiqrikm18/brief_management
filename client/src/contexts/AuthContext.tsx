import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const { data } = await api.get<{ user: User }>("/auth/me");

        if (data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<{ user: User }>("/auth/login", {
        email,
        password,
      });

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
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
