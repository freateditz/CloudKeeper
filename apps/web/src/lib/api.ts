import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Tracks whether a refresh has already failed during this client session.
// Once a refresh returns 401 we stop attempting any further refreshes
// (no more POSTs to /auth/refresh-token) until the user logs in again.
// This breaks the infinite refresh-token loop that would otherwise occur
// when the refresh cookie is missing — every 401 from a normal API call
// would re-enter the interceptor and re-POST refresh-token.
let refreshFailedThisSession = false;

// Tracks a refresh that's currently in-flight so concurrent 401s share it
// instead of each firing their own /auth/refresh-token POST.
let inFlightRefresh: Promise<string | null> | null = null;

function isRefreshRequest(config: any): boolean {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh-token");
}

function performRefresh(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = (async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
      const accessToken: string | undefined = response.data?.accessToken;
      if (!accessToken) {
        refreshFailedThisSession = true;
        return null;
      }
      // Successful refresh — allow future refreshes if the new access
      // token also expires later in this session.
      refreshFailedThisSession = false;
      return accessToken;
    } catch {
      refreshFailedThisSession = true;
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();
  return inFlightRefresh;
}

// Response interceptor — handles 401s by attempting a single refresh and
// retrying the original request. Hard rules:
//   1. Never retry a /auth/refresh-token request itself (would loop).
//   2. If a refresh has already failed this session, never try again.
//   3. If the refresh fails, clear local auth state and reject. Do NOT
//      force a full page reload — the protected-route layout will
//      router.push("/login") on its own.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Rule 1: don't retry refresh-token requests — that's the call
    // we're trying to recover *with*, so retrying it just creates a
    // chain of identical 401s.
    if (isRefreshRequest(originalRequest)) {
      return Promise.reject(error);
    }

    // Rule 2: a previous refresh already failed this session. Treat
    // the user as logged out and pass the 401 through unchanged.
    if (refreshFailedThisSession) {
      return Promise.reject(error);
    }

    // Rule: never retry the same request more than once (per-config).
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const accessToken = await performRefresh();
    if (!accessToken) {
      // Refresh failed. Clear any stale credentials so subsequent
      // calls don't carry a dead Authorization header. The protected
      // route layout observes `user === null && !isLoading` and
      // navigates to /login via the SPA router — no need for a
      // window.location.href (which would full-reload and re-trigger
      // fetchUser, restarting the loop).
      setAuthToken(null);
      return Promise.reject(error);
    }

    setAuthToken(accessToken);
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
    return api(originalRequest);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
    // A new (non-null) access token means a fresh session — allow the
    // interceptor to attempt future refreshes if this token expires.
    refreshFailedThisSession = false;
  } else {
    delete api.defaults.headers.common["Authorization"];
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    refreshFailedThisSession = true;
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
}
