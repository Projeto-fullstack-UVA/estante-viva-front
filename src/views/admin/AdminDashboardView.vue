<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { userService, bookService, loanService } from '@/services'
import AppIcon from '@/components/common/AppIcon.vue'
import type { User, Book, Loan } from '@/types'

const users = ref<User[]>([])
const books = ref<Book[]>([])
const loans = ref<Loan[]>([])
const isLoading = ref(true)

const loadData = async () => {
  try {
    isLoading.value = true
    const [u, b, l] = await Promise.all([
      userService.getAllUsers(),
      bookService.getAllBooks(),
      loanService.getAllLoans()
    ])
    users.value = u
    books.value = b
    loans.value = l
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

const activeLoansCount = computed(() => loans.value.filter(l => !l.returned_at).length)
const availableBooksCount = computed(() => books.value.filter(b => b.status === 'available').length)
const availablePercent = computed(() =>
  books.value.length === 0 ? 0 : (availableBooksCount.value / books.value.length) * 100,
)
const lateLoansCount = computed(() => {
  const now = new Date()
  return loans.value.filter(l => !l.returned_at && new Date(l.return_date) < now).length
})

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-head">
      <p class="eyebrow">Visão geral</p>
      <h1 class="page-title">Dashboard.</h1>
      <p class="page-description">Acompanhe os números do sistema Estante Viva em tempo real.</p>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando estatísticas...</div>

    <div v-else>
      <!-- KPIs -->
      <div class="stat-grid">
        <div class="stat">
          <span class="stat__icon"><AppIcon name="users" /></span>
          <span class="stat__label">Total de usuários</span>
          <span class="stat__value">{{ users.length }}</span>
        </div>
        <div class="stat">
          <span class="stat__icon"><AppIcon name="book" /></span>
          <span class="stat__label">Total de livros</span>
          <span class="stat__value">{{ books.length }}</span>
        </div>
        <div class="stat">
          <span class="stat__icon"><AppIcon name="repeat" /></span>
          <span class="stat__label">Empréstimos ativos</span>
          <span class="stat__value">{{ activeLoansCount }}</span>
        </div>
        <div class="stat" :class="{ 'stat--warning': lateLoansCount > 0 }">
          <span class="stat__icon"><AppIcon name="alert" /></span>
          <span class="stat__label">Empréstimos atrasados</span>
          <span class="stat__value">{{ lateLoansCount }}</span>
        </div>
      </div>

      <!-- Availability meter -->
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Disponibilidade do acervo</div>
            <div class="card-sub">Proporção de livros prontos para empréstimo</div>
          </div>
          <span class="meter-pct">{{ Math.round(availablePercent) }}%</span>
        </div>
        <div class="meter">
          <div class="meter__fill" :style="{ width: `${availablePercent}%` }"></div>
        </div>
        <p class="meter-detail">
          {{ availableBooksCount }} de {{ books.length }} livros estão disponíveis para empréstimo.
        </p>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.stat--warning .stat__icon {
  background: var(--warning-soft);
  color: var(--warning-deep);
}
.stat--warning .stat__value {
  color: var(--warning-deep);
}

.meter-pct {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 500;
  color: var(--ink);
}
.meter {
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--canvas-soft-2);
  overflow: hidden;
}
.meter__fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--primary);
  transition: width 0.5s ease-out;
}
.meter-detail {
  margin-top: var(--space-sm);
  font-size: 0.875rem;
  color: var(--body);
}
</style>
