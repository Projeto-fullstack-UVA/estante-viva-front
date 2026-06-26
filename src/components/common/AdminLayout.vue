<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import { useAuth } from "@/services/auth";
import AppLogo from "@/components/common/AppLogo.vue";
import AppIcon from "@/components/common/AppIcon.vue";
import ThemeToggle from "@/components/common/ThemeToggle.vue";

const { user, logout } = useAuth();
const router = useRouter();

const handleLogout = () => {
  logout();
  router.push("/login");
};
</script>

<template>
  <div class="admin-layout">
    <aside class="side">
      <div class="side__head">
        <RouterLink to="/admin" class="brand">
          <span class="brand__mark"><AppLogo /></span>
          <span class="brand__name">Estante Viva</span>
        </RouterLink>
        <p class="side__tag">Console administrativo</p>
      </div>

      <nav class="side__nav">
        <RouterLink
          to="/admin"
          class="side__link"
          exact-active-class="side__link--active"
        >
          <AppIcon name="grid" :size="18" />
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink
          to="/admin/users"
          class="side__link"
          active-class="side__link--active"
        >
          <AppIcon name="users" :size="18" />
          <span>Usuários</span>
        </RouterLink>
        <RouterLink
          to="/admin/books"
          class="side__link"
          active-class="side__link--active"
        >
          <AppIcon name="book" :size="18" />
          <span>Livros</span>
        </RouterLink>
        <RouterLink
          to="/admin/loans"
          class="side__link"
          active-class="side__link--active"
        >
          <AppIcon name="repeat" :size="18" />
          <span>Empréstimos</span>
        </RouterLink>
        <RouterLink
          to="/admin/events"
          class="side__link"
          active-class="side__link--active"
        >
          <AppIcon name="calendar" :size="18" />
          <span>Eventos</span>
        </RouterLink>
        <RouterLink
          to="/admin/institutions"
          class="side__link"
          active-class="side__link--active"
        >
          <AppIcon name="building" :size="18" />
          <span>Instituições</span>
        </RouterLink>
      </nav>

      <div class="side__foot">
        <div class="side__user" v-if="user">
          <span class="side__avatar">{{
            user.name.charAt(0).toUpperCase()
          }}</span>
          <div class="side__user-meta">
            <p class="side__name">{{ user.name }}</p>
            <p class="side__role">Administrador</p>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm btn-block"
          @click="handleLogout"
        >
          <AppIcon name="log-out" :size="15" />
          Sair
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-top">
        <span class="admin-top__label">Painel administrativo</span>
        <div class="cluster">
          <ThemeToggle />
          <RouterLink to="/library" class="btn btn-secondary btn-sm">
            <AppIcon name="store" :size="15" />
            Ir para biblioteca
          </RouterLink>
        </div>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>
