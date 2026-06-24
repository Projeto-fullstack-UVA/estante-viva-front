<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/services/auth'
import { formatPoints } from '@/utils'
import AppLogo from '@/components/common/AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()

const handleLogout = () => {
  logout()
  router.push('/login')
}

const isActive = (path: string): boolean => {
  return route.path === path
}
</script>

<template>
  <header class="topnav">
    <div class="topnav__inner">
      <RouterLink to="/dashboard" class="brand">
        <span class="brand__mark"><AppLogo /></span>
        <span class="brand__name">Estante Viva</span>
      </RouterLink>

      <nav class="navlinks" aria-label="Navegação principal">
        <RouterLink to="/dashboard" class="navlink" :class="{ 'navlink--active': isActive('/dashboard') }">
          Meu perfil
        </RouterLink>
        <RouterLink to="/library" class="navlink" :class="{ 'navlink--active': isActive('/library') }">
          Biblioteca
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
        <span class="who">{{ user?.name ?? 'Usuário' }}</span>
        <button type="button" class="btn btn-secondary btn-sm" @click="handleLogout">
          <AppIcon name="log-out" :size="15" />
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topnav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--canvas);
  border-bottom: 1px solid var(--hairline);
}
.topnav__inner {
  max-width: var(--page-width);
  margin: 0 auto;
  height: 64px;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--ink);
  flex-shrink: 0;
}
.brand__mark {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 4px;
  border-radius: var(--radius-sm);
  background: var(--canvas-soft-2);
  color: var(--ink);
}
.brand__name {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.navlinks {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.navlink {
  padding: 6px var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--body);
  transition: background var(--transition), color var(--transition);
}
.navlink:hover {
  background: var(--canvas-soft-2);
  color: var(--ink);
}
.navlink--active {
  background: var(--canvas-soft-2);
  color: var(--ink);
  font-weight: 500;
}

.topnav__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
}
.points {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-full);
  background: var(--canvas-soft-2);
  border: 1px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--body);
  white-space: nowrap;
}
.who {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink);
}

@media (max-width: 768px) {
  .topnav__inner {
    gap: var(--space-sm);
    padding: 0 var(--space-md);
  }
  .brand__name,
  .who {
    display: none;
  }
  .navlink {
    padding: 6px 10px;
  }
}
@media (max-width: 480px) {
  .points {
    display: none;
  }
}
</style>
