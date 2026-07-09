"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../lib/api";
import { AuthUser } from "@cloudkeeper/types";

interface AuthContextType {
  user: AuthUser | null;
  login: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session/token if needed
    setIsLoading(false);
  }, []);

  const login = async (data: any) => {
    const response = await api.post("/auth/login", data);
    setUser(response.data.user);
    api.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;
  };

  const logout = () => {
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
