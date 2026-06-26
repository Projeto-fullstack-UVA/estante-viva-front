import type { Router } from "vue-router";
import { useAuth } from "@/services/auth";

export function setupRouteGuards(router: Router) {
  router.beforeEach((to) => {
    const { isAuthenticated, user, loadStoredUser } = useAuth();

    loadStoredUser();

    const isLoginPage = to.path === "/login";
    const requiresAuth = to.meta.requiresAuth !== false;
    const requiresAdmin = to.meta.requiresAdmin === true;
    const requiresTeacher = to.meta.requiresTeacher === true;

    if (requiresAuth && !isAuthenticated.value) {
      return isLoginPage ? true : "/login";
    }

    if (requiresAdmin && user.value?.role !== "admin") {
      return "/dashboard";
    }

    // Teacher routes are open to teachers and admins (admins have a superset of
    // the teacher's capabilities).
    if (
      requiresTeacher &&
      user.value?.role !== "teacher" &&
      user.value?.role !== "admin"
    ) {
      return "/dashboard";
    }

    if (isLoginPage && isAuthenticated.value) {
      return "/dashboard";
    }

    return true;
  });
}
