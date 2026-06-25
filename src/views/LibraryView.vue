<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AuthenticatedLayout from '@/components/common/AuthenticatedLayout.vue'
import { useAuth } from '@/services/auth'
import { bookService, loanService } from '@/services'
import { formatDate, getStatusLabel } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Book, Loan } from '@/types'

const { user } = useAuth()
const isLoading = ref(true)
const error = ref<string | null>(null)
const books = ref<Book[]>([])
const activeLoans = ref<Loan[]>([])
const titleFilter = ref('')
const authorFilter = ref('')
const statusFilter = ref<string>('all')

const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    ;[books.value, activeLoans.value] = await Promise.all([
      bookService.getAllBooks(),
      user.value ? loanService.getUserLoans(user.value.id) : Promise.resolve([]),
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar livros'
  } finally {
    isLoading.value = false
  }
}

const filteredBooks = computed(() => {
  return books.value.filter((book) => {
    const matchesTitle =
      titleFilter.value === '' ||
      book.title.toLowerCase().includes(titleFilter.value.toLowerCase())
    const matchesAuthor =
      authorFilter.value === '' ||
      book.author.toLowerCase().includes(authorFilter.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || book.status === statusFilter.value
    return matchesTitle && matchesAuthor && matchesStatus
  })
})

const availableCount = computed(() => books.value.filter((b) => b.status === 'available').length)
const lentCount = computed(() => books.value.filter((b) => b.status === 'lent').length)

const getActiveLoanForBook = (bookId: number): Loan | undefined => {
  return activeLoans.value.find((l) => l.book_id === bookId && !l.returned_at)
}

// Default loan period: 14 days from today (matches the API's previous default).
const LOAN_PERIOD_DAYS = 14
const defaultReturnDate = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + LOAN_PERIOD_DAYS)
  return d.toISOString()
}

const handleBorrow = async (bookId: number) => {
  if (!user.value) return
  try {
    await loanService.borrowBook(bookId, defaultReturnDate())
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao pegar livro emprestado'
  }
}

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao devolver livro'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <AuthenticatedLayout>
    <div class="page-head">
      <p class="eyebrow">Acervo</p>
      <h1 class="page-title">Biblioteca.</h1>
      <p class="page-description">
        Explore o acervo completo, filtre por título, autor ou status e encontre seu próximo livro.
      </p>
    </div>

    <div class="stat-grid">
      <div class="stat">
        <span class="stat__label">Total de livros</span>
        <span class="stat__value">{{ books.length }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Disponíveis</span>
        <span class="stat__value">{{ availableCount }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Emprestados</span>
        <span class="stat__value">{{ lentCount }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Resultados</span>
        <span class="stat__value">{{ filteredBooks.length }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="titleFilter" type="text" placeholder="Buscar por título..." />
      </div>
      <input v-model="authorFilter" class="filters__author" type="text" placeholder="Buscar por autor..." />
      <select v-model="statusFilter" class="filters__status">
        <option value="all">Todos os status</option>
        <option value="available">Disponível</option>
        <option value="lent">Emprestado</option>
      </select>
    </div>

    <div v-if="error" class="callout mb-md">{{ error }}</div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando livros...</div>

    <div v-else-if="filteredBooks.length === 0" class="empty">
      <span class="empty-icon"><AppIcon name="search" /></span>
      <p>Nenhum livro encontrado com os filtros selecionados.</p>
    </div>

    <div v-else class="book-grid">
      <article v-for="book in filteredBooks" :key="book.id" class="book-card">
        <div class="book-card__top">
          <span class="book-card__icon"><AppIcon name="book" :size="20" /></span>
          <span class="badge" :class="book.status === 'available' ? 'badge-success' : 'badge-warning'">
            {{ getStatusLabel(book.status) }}
          </span>
        </div>

        <div class="book-card__body">
          <h2 class="book-card__title">{{ book.title }}</h2>
          <p class="book-card__author">{{ book.author }}</p>
          <p class="book-card__meta">
            <span v-if="book.edition">{{ book.edition }} · </span>{{ formatDate(book.release_date) }}
          </p>
        </div>

        <div class="book-card__foot">
          <template v-if="getActiveLoanForBook(book.id)">
            <p class="book-card__note">
              Devolução até <strong>{{ formatDate(getActiveLoanForBook(book.id)!.return_date) }}</strong>
            </p>
            <button type="button" class="btn btn-secondary btn-sm" @click="handleReturn(getActiveLoanForBook(book.id)!.id)">
              <AppIcon name="return" :size="15" />
              Devolver
            </button>
          </template>
          <template v-else-if="book.status === 'available'">
            <button type="button" class="btn btn-primary btn-sm btn-block" @click="handleBorrow(book.id)">
              Pedir emprestado
            </button>
          </template>
          <template v-else>
            <p class="book-card__note">Indisponível no momento</p>
          </template>
        </div>
      </article>
    </div>
  </AuthenticatedLayout>
</template>
