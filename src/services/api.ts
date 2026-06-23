const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const TOKEN_KEY = 'token'

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
  },
}

export const apiClient = {
  async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = tokenStore.get()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(text || `API Error: ${response.status}`)
    }

    // Some endpoints return an empty body (e.g. 204 No Content).
    const raw = await response.text()
    return (raw ? JSON.parse(raw) : undefined) as T
  },

  get<T>(endpoint: string) {
    return this.request<T>('GET', endpoint)
  },

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>('POST', endpoint, data)
  },

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>('PUT', endpoint, data)
  },

  patch<T>(endpoint: string, data: unknown) {
    return this.request<T>('PATCH', endpoint, data)
  },

  delete<T>(endpoint: string) {
    return this.request<T>('DELETE', endpoint)
  },

  delete_with_body<T>(endpoint: string, data: unknown) {
    return this.request<T>('DELETE', endpoint, data)
  },
}
