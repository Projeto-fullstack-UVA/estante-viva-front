import { ref, computed } from 'vue'
import type { User, LoginPayload } from '@/types'
import { apiClient, tokenStore } from './api'
import { userService } from './index'

const user = ref<User | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

interface LoginResponse {
  id: number
  token: string
}

interface JwtClaims {
  user_id?: number
  role?: User['role']
  exp?: number
}

// Decodes the payload of a JWT without verifying the signature. The API signs
// tokens server-side; the client only needs the claims (id, role) it carries.
const decodeJwt = (token: string): JwtClaims | null => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  const login = async (payload: LoginPayload) => {
    isLoading.value = true
    error.value = null

    try {
      const { id, token } = await apiClient.post<LoginResponse>('/login', payload)
      tokenStore.set(token)

      const claims = decodeJwt(token)
      const role = (claims?.role ?? 'student') as User['role']

      // The API only returns { id, token } on login and exposes full user
      // details on an admin-only endpoint, so we build a baseline profile from
      // the JWT claims and enrich it from /users/:id when the role allows it.
      let resolved: User = {
        id,
        name: payload.email.split('@')[0] ?? payload.email,
        email: payload.email,
        role,
        points: 0,
        campus: '',
        created_at: '',
      }

      if (role === 'admin') {
        try {
          resolved = await userService.getUser(id)
        } catch (err) {
          console.error('Failed to load admin profile:', err)
        }
      }

      user.value = resolved
      localStorage.setItem('user', JSON.stringify(resolved))

      return resolved
    } catch (err) {
      error.value = 'Email ou senha inválidos'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
    tokenStore.clear()
    error.value = null
  }

  const loadStoredUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User & { institution?: string }
        user.value = {
          ...parsed,
          campus: parsed.campus ?? parsed.institution ?? '',
        }
      } catch {
        logout()
      }
    }
  }

  const refreshUser = async () => {
    // Full user details are only readable on the admin-only /users/:id route.
    if (!user.value || user.value.role !== 'admin') return
    try {
      const refreshedUser = await userService.getUser(user.value.id)
      user.value = refreshedUser
      localStorage.setItem('user', JSON.stringify(refreshedUser))
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    logout,
    loadStoredUser,
    refreshUser,
  }
}
