"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api, setAuthToken, getAuthToken } from "../lib/api";
import type { AuthUser } from "@cloudkeeper/types";

interface AuthContextType {
  user: AuthUser | null;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setAuthToken(token);

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (data: { email: string; password: string }) => {
    setError(null);
    try {
      const response = await api.post("/auth/login", data);
      const { accessToken, user: userData } = response.data;
      setAuthToken(accessToken);
      setUser(userData);
    } catch (err: any) {
      const message = err.response?.data?.error || "Login failed. Please try again.";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};