<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'
import AppLogo from '@/components/common/AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/login')
}
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
        <RouterLink to="/admin" class="side__link" exact-active-class="side__link--active">
          <AppIcon name="grid" :size="18" />
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/admin/users" class="side__link" active-class="side__link--active">
          <AppIcon name="users" :size="18" />
          <span>Usuários</span>
        </RouterLink>
        <RouterLink to="/admin/books" class="side__link" active-class="side__link--active">
          <AppIcon name="book" :size="18" />
          <span>Livros</span>
        </RouterLink>
        <RouterLink to="/admin/loans" class="side__link" active-class="side__link--active">
          <AppIcon name="repeat" :size="18" />
          <span>Empréstimos</span>
        </RouterLink>
      </nav>

      <div class="side__foot">
        <div class="side__user" v-if="user">
          <span class="side__avatar">{{ user.name.charAt(0).toUpperCase() }}</span>
          <div class="side__user-meta">
            <p class="side__name">{{ user.name }}</p>
            <p class="side__role">Administrador</p>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm btn-block" @click="handleLogout">
          <AppIcon name="log-out" :size="15" />
          Sair
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-top">
        <span class="admin-top__label">Painel administrativo</span>
        <RouterLink to="/library" class="btn btn-secondary btn-sm">
          <AppIcon name="store" :size="15" />
          Ir para biblioteca
        </RouterLink>
      </header>

      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--canvas-soft);
}

/* Sidebar */
.side {
  width: 260px;
  background: var(--canvas);
  border-right: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
}
.side__head {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--hairline);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--ink);
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
}
.side__tag {
  margin-top: var(--space-sm);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--mute);
}

.side__nav {
  flex: 1;
  padding: var(--space-md) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.side__link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 9px var(--space-sm);
  border-radius: var(--radius-sm);
  color: var(--body);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: inset 2px 0 0 transparent;
  transition: background var(--transition), color var(--transition), box-shadow var(--transition);
}
.side__link:hover {
  background: var(--canvas-soft);
  color: var(--ink);
}
.side__link--active {
  background: var(--canvas-soft);
  color: var(--ink);
  box-shadow: inset 2px 0 0 var(--primary);
}

.side__foot {
  padding: var(--space-md);
  border-top: 1px solid var(--hairline);
}
.side__user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.side__avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: var(--on-primary);
  display: grid;
  place-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
}
.side__user-meta {
  min-width: 0;
}
.side__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.side__role {
  font-size: 0.75rem;
  color: var(--mute);
}

/* Main */
.admin-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.admin-top {
  height: 64px;
  background: var(--canvas);
  border-bottom: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-xl);
  position: sticky;
  top: 0;
  z-index: 40;
}
.admin-top__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--mute);
}
.admin-content {
  padding: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 900px) {
  .admin-layout {
    flex-direction: column;
  }
  .side {
    position: sticky;
    top: 0;
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: var(--space-sm);
    border-right: none;
    border-bottom: 1px solid var(--hairline);
    padding: 0 var(--space-md);
    overflow-x: auto;
  }
  .side__head {
    padding: var(--space-sm) 0;
    border-bottom: none;
    flex-shrink: 0;
  }
  .side__tag {
    display: none;
  }
  .side__nav {
    flex-direction: row;
    padding: 0;
    gap: 2px;
  }
  .side__link {
    box-shadow: none;
    white-space: nowrap;
  }
  .side__link--active {
    box-shadow: inset 0 -2px 0 var(--primary);
    border-radius: 0;
  }
  .side__foot {
    margin-left: auto;
    padding: var(--space-sm) 0;
    border-top: none;
    flex-shrink: 0;
  }
  .side__user {
    display: none;
  }
  .admin-main {
    margin-left: 0;
  }
  .admin-top {
    padding: 0 var(--space-md);
  }
  .admin-content {
    padding: var(--space-lg) var(--space-md);
  }
}
</style>
