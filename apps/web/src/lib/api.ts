import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Module-duplication safety: Next.js production builds may bundle this
// `api` module into more than one chunk (one for the auth-context's
// imports of `setAuthToken`, another for the dashboard's import of
// `api`). Each bundle then runs this top-level code, which would
// otherwise create multiple axios instances with inconsistent state.
// We pin the instance to `globalThis` so every chunk shares the same
// axios instance, the same `refreshFailedThisSession` flag, and the
// same in-flight refresh promise. The first evaluation creates the
// instance + interceptors; every later evaluation (in any chunk) finds
// and reuses it.
declare global {
  // eslint-disable-next-line no-var
  var __cloudkeeperApi: AxiosInstance | undefined;
  // eslint-disable-next-line no-var
  var __cloudkeeperAuthFlags:
    | {
        refreshFailedThisSession: boolean;
        inFlightRefresh: Promise<string | null> | null;
      }
    | undefined;
}

function getApi(): AxiosInstance {
  if (globalThis.__cloudkeeperApi) return globalThis.__cloudkeeperApi;

  const instance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Request interceptor: attach the current access token to every
  // outbound request, reading it from localStorage. Because this runs
  // per-request (not at instance creation), it works correctly even
  // when the module is duplicated across chunks — every chunk shares
  // the same axios instance via globalThis, but the localStorage read
  // is global regardless.
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? ({} as any);
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor — handles 401s by attempting a single refresh
  // and retrying the original request. Hard rules:
  //   1. Never retry a /auth/refresh-token request itself (would loop).
  //   2. If a refresh has already failed this session, never try again.
  //   3. If the refresh fails, clear local auth state and reject. Do NOT
  //      force a full page reload — the protected-route layout will
  //      router.push("/login") on its own.
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if (status !== 401) {
        return Promise.reject(error);
      }

      // Rule 1: don't retry refresh-token requests.
      if (isRefreshRequest(originalRequest)) {
        return Promise.reject(error);
      }

      // Rule 2: a previous refresh already failed this session.
      if (globalThis.__cloudkeeperAuthFlags?.refreshFailedThisSession) {
        return Promise.reject(error);
      }

      // Rule: never retry the same request more than once (per-config).
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      const accessToken = await performRefresh();
      if (!accessToken) {
        setAuthToken(null);
        return Promise.reject(error);
      }

      setAuthToken(accessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
      return instance(originalRequest);
    }
  );

  globalThis.__cloudkeeperApi = instance;
  return instance;
}

function getAuthFlags() {
  if (!globalThis.__cloudkeeperAuthFlags) {
    globalThis.__cloudkeeperAuthFlags = {
      refreshFailedThisSession: false,
      inFlightRefresh: null,
    };
  }
  return globalThis.__cloudkeeperAuthFlags;
}

function isRefreshRequest(config: any): boolean {
  const url = config?.url ?? "";
  return url.includes("/auth/refresh-token");
}

function performRefresh(): Promise<string | null> {
  const flags = getAuthFlags();
  if (flags.inFlightRefresh) return flags.inFlightRefresh;
  flags.inFlightRefresh = (async () => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );
      const accessToken: string | undefined = response.data?.accessToken;
      if (!accessToken) {
        flags.refreshFailedThisSession = true;
        return null;
      }
      flags.refreshFailedThisSession = false;
      return accessToken;
    } catch {
      flags.refreshFailedThisSession = true;
      return null;
    } finally {
      flags.inFlightRefresh = null;
    }
  })();
  return flags.inFlightRefresh;
}

// Eagerly create the shared instance at module-load time so the
// interceptors are attached before any request is issued. Because the
// instance is pinned to globalThis, the second/third bundle evaluation
// in other chunks will short-circuit in getApi() and reuse it.
export const api = getApi();

export function setAuthToken(token: string | null) {
  // Source of truth is localStorage. We intentionally do NOT mutate
  // `api.defaults.headers` here — with Next.js module duplication the
  // caller may be operating on a different chunk's axios instance than
  // the one that will actually send the next request. The request
  // interceptor reads from localStorage on every request.
  const flags = getAuthFlags();
  if (token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
    flags.refreshFailedThisSession = false;
  } else {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    flags.refreshFailedThisSession = true;
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
}
