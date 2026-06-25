<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { loanService, institutionService } from '@/services'
import { formatDate, formatPoints } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Loan, Institution } from '@/types'

const { user, refreshUser } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)
const loans = ref<Loan[]>([])
const activeLoans = ref<Loan[]>([])
const returnedLoans = ref<Loan[]>([])
const institutions = ref<Institution[]>([])

const institutionName = (id: number | null | undefined) => {
  if (id == null) return ''
  return institutions.value.find((i) => i.id === id)?.name ?? ''
}

const loadUserData = async () => {
  if (!user.value) return
  try {
    isLoading.value = true
    error.value = null
    await refreshUser()
    institutions.value = await institutionService.getAllInstitutions()
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
  admin: 'Administrador',
}

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <AuthenticatedLayout>
    <!-- Profile hero (polarity-flipped dark band) -->
    <section class="profile-hero">
      <div class="mesh mesh--soft"></div>
      <div class="profile-avatar">{{ user ? getInitials(user.name) : 'U' }}</div>
      <div class="profile-hero__info">
        <p class="profile-hero__eyebrow">Meu perfil</p>
        <h1 class="profile-hero__name">{{ user?.name ?? 'Usuário' }}</h1>
        <p class="profile-hero__meta">
          {{ user?.email }} · {{ roleLabel[user?.role ?? ''] ?? user?.role }}
          <template v-if="institutionName(user?.institution_id)"> · {{ institutionName(user?.institution_id) }}</template>
        </p>
      </div>
    </section>

    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat">
        <span class="stat__label">Pontos</span>
        <span class="stat__value">{{ formatPoints(user?.points ?? 0) }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Empréstimos ativos</span>
        <span class="stat__value">{{ activeLoans.length }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Devolvidos</span>
        <span class="stat__value">{{ returnedLoans.length }}</span>
      </div>
    </div>

    <!-- Account info -->
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Informações da conta</div>
          <div class="card-sub">Dados do seu perfil na plataforma</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Instituição</span>
          <span class="info-value">{{ institutionName(user?.institution_id) || '—' }}</span>
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

    <!-- Active loans -->
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Empréstimos ativos</div>
          <div class="card-sub">Livros que você está com no momento</div>
        </div>
        <span class="badge badge-neutral">{{ activeLoans.length }}</span>
      </div>
      <div v-if="isLoading" class="callout callout-neutral">Carregando dados...</div>
      <div v-else-if="error" class="callout">{{ error }}</div>
      <div v-else-if="activeLoans.length === 0" class="empty">
        <span class="empty-icon"><AppIcon name="book" /></span>
        <p>Nenhum empréstimo ativo no momento.</p>
      </div>
      <div v-else class="loan-grid">
        <article v-for="loan in activeLoans" :key="loan.id" class="loan-card">
          <span class="loan-card__eyebrow">Empréstimo</span>
          <strong class="loan-card__title">{{ loan.book_title }}</strong>
          <p class="loan-card__author">{{ loan.book_author }}</p>
          <p class="loan-card__due">
            Devolução até <strong>{{ formatDate(loan.return_date) }}</strong>
          </p>
          <button type="button" class="btn btn-secondary btn-sm loan-card__action" @click="handleReturn(loan.id)">
            <AppIcon name="return" :size="15" />
            Devolver
          </button>
        </article>
      </div>
    </div>

    <!-- History -->
    <div v-if="returnedLoans.length > 0" class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Histórico de empréstimos</div>
          <div class="card-sub">Livros já devolvidos</div>
        </div>
        <span class="badge badge-neutral">{{ returnedLoans.length }}</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Livro</th>
              <th>Autor</th>
              <th>Devolvido em</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loan in returnedLoans" :key="loan.id">
              <td class="cell-strong">{{ loan.book_title }}</td>
              <td>{{ loan.book_author }}</td>
              <td>{{ formatDate(loan.returned_at!) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AuthenticatedLayout>
</template>
