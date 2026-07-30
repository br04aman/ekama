import { apiFetch } from "@/lib/api";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; firstName: string; lastName?: string; phone: string }) => Promise<void>;
  updateUser: (nextUser: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "ekama-auth-v1";

const persistAuth = (user: User | null, token: string | null) => {
  try {
    if (user && token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { user?: User | null; token?: string | null };
      if (parsed?.user && parsed?.token) {
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch {
      void 0;
    }
  }, []);

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    persistAuth(nextUser, token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res?.data?.user && res?.data?.token) {
      const nextUser = res.data.user as User;
      const nextToken = res.data.token as string;
      setUser(nextUser);
      setToken(nextToken);
      persistAuth(nextUser, nextToken);
    } else {
      throw new Error("Invalid response from server");
    }
  }, []);

  const signup = useCallback(async (payload: { email: string; password: string; firstName: string; lastName?: string; phone: string }) => {
    const res = await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res?.data?.user && res?.data?.token) {
      const nextUser = res.data.user as User;
      const nextToken = res.data.token as string;
      setUser(nextUser);
      setToken(nextToken);
      persistAuth(nextUser, nextToken);
    } else {
      throw new Error("Invalid response from server");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persistAuth(null, null);
  }, []);

  const value: AuthState = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    login,
    signup,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
