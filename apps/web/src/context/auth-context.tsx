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
    // Bootstrap path. Three cases, in order:
    //   1. Access token exists in localStorage → set the header, hit
    //      /auth/me. On 200 we're done.
    //   2. Access token is missing OR /auth/me returns 401 → the
    //      HttpOnly `refreshToken` cookie is the source of truth.
    //      Call /auth/refresh-token (cookie travels automatically
    //      because the axios instance is created with
    //      `withCredentials: true`). On success we get a fresh access
    //      token back; persist it, then hit /auth/me.
    //   3. Refresh also fails → genuinely logged out; clear the
    //      stored token (if any) and leave `user` as null so the
    //      router sends the user to /login.
    const finishLoading = () => {
      // `isLoading` is the dashboard-layout gate; flipping it to false
      // is what lets the protected route render (or redirect). We
      // centralise the flip here so every branch — early return on
      // 200, fall-through on 401, success of the cookie refresh, and
      // the catch-all at the end — clears the spinner exactly once.
      setIsLoading((wasLoading) => (wasLoading ? false : wasLoading));
    };

    const token = getAuthToken();
    if (token) {
      setAuthToken(token);
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
        finishLoading();
        return;
      } catch (err: any) {
        // Only fall through to the cookie-driven refresh if the
        // server actually rejected the token (401). Any other failure
        // (network, 5xx) is left to the response interceptor — the
        // user is not authenticated, but we still want to release the
        // loading gate so the guard can redirect.
        if (err.response?.status !== 401) {
          setUser(null);
          finishLoading();
          return;
        }
      }
    }

    // No access token, or the one we had just expired. Try the
    // HttpOnly refresh-token cookie. We do this even when token is
    // null because the cookie may still be valid — that's exactly the
    // case that used to log the user out on every page refresh.
    try {
      const refresh = await api.post("/auth/refresh-token");
      const newAccessToken: string | undefined = refresh.data?.accessToken;
      if (!newAccessToken) {
        setAuthToken(null);
        setUser(null);
        return;
      }
      setAuthToken(newAccessToken);
      const me = await api.get("/auth/me");
      setUser(me.data.user);
    } catch {
      // Refresh-token cookie missing or rejected by the server — the
      // user is genuinely logged out. Drop any stale access token and
      // let the protected-route guard redirect them.
      setAuthToken(null);
      setUser(null);
    } finally {
      finishLoading();
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