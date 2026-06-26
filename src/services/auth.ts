import { ref, computed } from "vue";
import type { User, LoginPayload } from "@/types";
import { apiClient, tokenStore } from "./api";
import { userService } from "./index";

const user = ref<User | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

interface LoginResponse {
  id: number;
  token: string;
}

interface JwtClaims {
  user_id?: number;
  role?: User["role"];
  exp?: number;
}

// Decodes the payload of a JWT without verifying the signature. The API signs
// tokens server-side; the client only needs the claims (id, role) it carries.
const decodeJwt = (token: string): JwtClaims | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value);

  const login = async (payload: LoginPayload) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { id, token } = await apiClient.post<LoginResponse>(
        "/login",
        payload,
      );
      tokenStore.set(token);

      const claims = decodeJwt(token);
      const role = (claims?.role ?? "student") as User["role"];

      // The API only returns { id, token } on login, so we build a baseline
      // profile from the JWT claims and enrich it from /me, which returns the
      // authenticated caller's full record regardless of role.
      let resolved: User = {
        id,
        name: payload.email.split("@")[0] ?? payload.email,
        email: payload.email,
        role,
        points: 0,
        institution_id: null,
        created_at: "",
      };

      try {
        resolved = await userService.getMe();
      } catch (err) {
        console.error("Failed to load profile:", err);
      }

      user.value = resolved;
      localStorage.setItem("user", JSON.stringify(resolved));

      return resolved;
    } catch (err) {
      error.value = "Email ou senha inválidos";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    localStorage.removeItem("user");
    tokenStore.clear();
    error.value = null;
  };

  const loadStoredUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        user.value = {
          ...parsed,
          institution_id: parsed.institution_id ?? null,
        };
      } catch {
        logout();
      }
    }
  };

  const refreshUser = async () => {
    // /me returns the authenticated caller's full record for any role.
    if (!user.value) return;
    try {
      const refreshedUser = await userService.getMe();
      user.value = refreshedUser;
      localStorage.setItem("user", JSON.stringify(refreshedUser));
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  return {
    user: computed(() => user.value),
    isAuthenticated,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    login,
    logout,
    loadStoredUser,
    refreshUser,
  };
};
