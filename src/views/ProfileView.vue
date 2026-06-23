<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { loanService } from '@/services'
import { formatDate, formatPoints } from '@/utils'
import type { Loan } from '@/types'

const { user, refreshUser } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)
const loans = ref<Loan[]>([])
const activeLoans = ref<Loan[]>([])
const returnedLoans = ref<Loan[]>([])

const loadUserData = async () => {
  if (!user.value) return
  try {
    isLoading.value = true
    error.value = null
    await refreshUser()
    const userLoans = await loanService.getUserLoans(user.value.id)
    loans.value = userLoans
    activeLoans.value = userLoans.filter((l) => !l.returned_at)
    returnedLoans.value = userLoans.filter((l) => !!l.returned_at)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar dados'
  } finally {
    isLoading.value = false
  }
}

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadUserData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao devolver livro'
  }
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const roleLabel: Record<string, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  donator: 'Doador',
  admin: 'Administrador',
}

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <AuthenticatedLayout>
    <!-- Hero do perfil -->
    <div class="profile-hero">
      <div class="profile-avatar">
        {{ user ? getInitials(user.name) : 'U' }}
      </div>
      <div class="profile-hero-info">
        <h2>{{ user?.name ?? 'Usuário' }}</h2>
        <p>{{ user?.email }} &bull; {{ roleLabel[user?.role ?? ''] ?? user?.role }}</p>
        <p>{{ user?.campus }}</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-card-value">{{ formatPoints(user?.points ?? 0) }}</span>
        <span class="stat-card-label">Pontos</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ activeLoans.length }}</span>
        <span class="stat-card-label">Empréstimos ativos</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-value">{{ returnedLoans.length }}</span>
        <span class="stat-card-label">Devolvidos</span>
      </div>
    </div>

    <!-- Info do usuário -->
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Informações da conta</div>
          <div class="card-subtitle">Dados do seu perfil na plataforma</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Campus</span>
          <span class="info-value">{{ user?.campus || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Perfil</span>
          <span class="info-value">{{ roleLabel[user?.role ?? ''] ?? user?.role }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Membro desde</span>
          <span class="info-value">{{ user?.created_at ? formatDate(user.created_at) : '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">{{ user?.email }}</span>
        </div>
      </div>
    </div>

    <!-- Empréstimos Ativos -->
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Empréstimos Ativos</div>
          <div class="card-subtitle">Livros que você está com no momento</div>
        </div>
        <span class="badge badge-green">{{ activeLoans.length }}</span>
      </div>
      <div v-if="isLoading" class="callout neutral">Carregando dados...</div>
      <div v-else-if="error" class="callout">{{ error }}</div>
      <div v-else-if="activeLoans.length === 0" class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p>Nenhum empréstimo ativo no momento.</p>
      </div>
      <div v-else class="section-grid">
        <div v-for="loan in activeLoans" :key="loan.id" class="profile-card">
          <span class="profile-card-title">Título</span>
          <strong>{{ loan.book_title }}</strong>
          <p>{{ loan.book_author }}</p>
          <p style="font-size: 0.8rem; color: var(--gray-500);">
            Devolução até <strong style="color: var(--gray-700);">{{ formatDate(loan.return_date) }}</strong>
          </p>
          <button type="button" class="btn secondary small" @click="handleReturn(loan.id)">
            Devolver
          </button>
        </div>
      </div>
    </div>

    <!-- Histórico -->
    <div v-if="returnedLoans.length > 0" class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header">
        <div>
          <div class="card-title">Histórico de Empréstimos</div>
          <div class="card-subtitle">Livros já devolvidos</div>
        </div>
        <span class="badge badge-gray">{{ returnedLoans.length }}</span>
      </div>
      <div class="table-shell">
        <table class="table-view">
          <thead>
            <tr>
              <th>Livro</th>
              <th>Autor</th>
              <th>Devolvido em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in returnedLoans" :key="loan.id">
              <td>{{ loan.book_title }}</td>
              <td>{{ loan.book_author }}</td>
              <td>{{ formatDate(loan.returned_at!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gray-400);
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-800);
}
</style>
