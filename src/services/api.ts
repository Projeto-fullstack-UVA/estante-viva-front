const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TOKEN_KEY = "token";

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// The API wraps every response in a uniform envelope:
//   success: { "success": true, "data": <payload> }
//   failure: { "success": false, "error_info": { "code", "message" } }
// We unwrap `data` at the client boundary so the services keep working with the
// bare payloads they expect.
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error_info?: { code: string; message: string };
}

export const apiClient = {
  async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = tokenStore.get();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Some endpoints may return an empty body (e.g. 204 No Content).
    const raw = await response.text();
    let envelope: ApiEnvelope<T> | undefined;
    if (raw) {
      try {
        envelope = JSON.parse(raw) as ApiEnvelope<T>;
      } catch {
        // Non-JSON body: fall through to the status-based error handling below.
      }
    }

    if (!response.ok || envelope?.success === false) {
      const message =
        envelope?.error_info?.message || raw || `API Error: ${response.status}`;
      throw new Error(message);
    }

    return (envelope ? envelope.data : undefined) as T;
  },

  get<T>(endpoint: string) {
    return this.request<T>("GET", endpoint);
  },

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>("POST", endpoint, data);
  },

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>("PUT", endpoint, data);
  },

  patch<T>(endpoint: string, data: unknown) {
    return this.request<T>("PATCH", endpoint, data);
  },

  delete<T>(endpoint: string) {
    return this.request<T>("DELETE", endpoint);
  },

  delete_with_body<T>(endpoint: string, data: unknown) {
    return this.request<T>("DELETE", endpoint, data);
  },
};
