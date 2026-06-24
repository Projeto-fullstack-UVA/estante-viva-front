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

const handleBorrow = async (bookId: number) => {
  if (!user.value) return
  try {
    await loanService.borrowBook(user.value.id, bookId)
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

    <div v-if="error" class="callout" style="margin-bottom: var(--space-md)">{{ error }}</div>

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

<style scoped>
.filters {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}
.search {
  position: relative;
  flex: 1;
  min-width: 220px;
}
.search :deep(svg) {
  position: absolute;
  left: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--mute);
  pointer-events: none;
}
.search input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-sm) 0 36px;
  background: var(--canvas);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search input::placeholder {
  color: var(--mute);
}
.search input:focus {
  border-color: var(--hairline-strong);
  box-shadow: 0 0 0 1px var(--hairline-strong);
}
.filters__author {
  flex: 0.7;
  min-width: 180px;
  height: 40px;
  padding: 0 var(--space-sm);
  background: var(--canvas);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.filters__author::placeholder {
  color: var(--mute);
}
.filters__author:focus {
  border-color: var(--hairline-strong);
  box-shadow: 0 0 0 1px var(--hairline-strong);
}
.filters__status {
  height: 40px;
  min-width: 170px;
  padding: 0 var(--space-sm);
  background: var(--canvas);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.filters__status:focus {
  border-color: var(--hairline-strong);
  box-shadow: 0 0 0 1px var(--hairline-strong);
}

.book-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.book-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--canvas);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
  transition: box-shadow var(--transition);
}
.book-card:hover {
  box-shadow: var(--elevation-3);
}
.book-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}
.book-card__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--canvas-soft-2);
  color: var(--ink);
}
.book-card__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.book-card__title {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--ink);
}
.book-card__author {
  font-size: 0.875rem;
  color: var(--body);
}
.book-card__meta {
  font-size: 0.75rem;
  color: var(--mute);
}
.book-card__foot {
  margin-top: auto;
  padding-top: var(--space-sm);
  border-top: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.book-card__note {
  font-size: 0.8125rem;
  color: var(--mute);
}
.book-card__note strong {
  font-weight: 500;
  color: var(--body);
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
  }
  .search,
  .filters__author,
  .filters__status {
    min-width: 0;
    width: 100%;
    flex: none;
  }
  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>
