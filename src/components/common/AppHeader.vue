<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "@/services/auth";
import { formatPoints } from "@/utils";
import AppLogo from "@/components/common/AppLogo.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import ThemeToggle from "@/components/common/ThemeToggle.vue";

const router = useRouter();
const route = useRoute();
const { user, logout } = useAuth();

const handleLogout = () => {
  logout();
  router.push("/login");
};

const isActive = (path: string): boolean => {
  return route.path === path;
};
</script>

<template>
  <header class="topnav">
    <div class="topnav__inner">
      <RouterLink to="/dashboard" class="brand">
        <span class="brand__mark"><AppLogo /></span>
        <span class="brand__name">Estante Viva</span>
      </RouterLink>

      <nav class="navlinks" aria-label="Navegação principal">
        <RouterLink
          to="/dashboard"
          class="navlink"
          :class="{ 'navlink--active': isActive('/dashboard') }"
        >
          Meu perfil
        </RouterLink>
        <RouterLink
          to="/library"
          class="navlink"
          :class="{ 'navlink--active': isActive('/library') }"
        >
          Biblioteca
        </RouterLink>
        <RouterLink
          to="/events"
          class="navlink"
          :class="{ 'navlink--active': isActive('/events') }"
        >
          Eventos
        </RouterLink>
        <RouterLink
          v-if="user?.role === 'teacher'"
          to="/teacher"
          class="navlink"
          :class="{ 'navlink--active': route.path.startsWith('/teacher') }"
        >
          Painel professor
        </RouterLink>
        <RouterLink
          v-if="user?.role === 'admin'"
          to="/admin"
          class="navlink"
          :class="{ 'navlink--active': route.path.startsWith('/admin') }"
        >
          Painel admin
        </RouterLink>
      </nav>

      <div class="topnav__actions">
        <span class="points">
          <AppIcon name="star" :size="13" />
          {{ formatPoints(user?.points ?? 0) }} pts
        </span>
        <span class="who">{{ user?.name ?? "Usuário" }}</span>
        <ThemeToggle />
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          @click="handleLogout"
        >
          <AppIcon name="log-out" :size="15" />
          Sair
        </button>
      </div>
    </div>
  </header>
</template>
