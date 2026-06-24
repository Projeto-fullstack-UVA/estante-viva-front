<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { loanService, userService, bookService } from '@/services'
import { formatDate } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Loan, User, Book } from '@/types'

const loans = ref<Loan[]>([])
const users = ref<User[]>([])
const books = ref<Book[]>([])
const isLoading = ref(true)
const statusFilter = ref('active')

const isAddingLoan = ref(false)
const newLoan = ref({ user_id: null as number | null, book_id: null as number | null })

const availableBooks = computed(() => books.value.filter((b) => b.status === 'available'))

const loadData = async () => {
  try {
    isLoading.value = true
    const [l, u, b] = await Promise.all([
      loanService.getAllLoans(),
      userService.getAllUsers(),
      bookService.getAllBooks()
    ])
    loans.value = l
    users.value = u
    books.value = b
  } catch (error) {
    console.error('Erro ao carregar empréstimos:', error)
  } finally {
    isLoading.value = false
  }
}

const getUserName = (userId: number) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.name : `Usuário #${userId}`
}

const getBookTitle = (bookId: number) => {
  const book = books.value.find(b => b.id === bookId)
  return book ? book.title : `Livro #${bookId}`
}

const filteredLoans = computed(() => {
  return loans.value.filter(l => {
    if (statusFilter.value === 'active') return !l.returned_at
    if (statusFilter.value === 'returned') return !!l.returned_at
    return true
  })
})

const handleReturn = async (loanId: number) => {
  try {
    await loanService.returnBook(loanId)
    await loadData()
  } catch (error) {
    console.error('Erro ao devolver livro:', error)
    alert('Erro ao devolver livro')
  }
}

const handleAddLoan = async () => {
  if (!newLoan.value.user_id || !newLoan.value.book_id) return
  try {
    await loanService.borrowBook(newLoan.value.user_id, newLoan.value.book_id)
    isAddingLoan.value = false
    newLoan.value = { user_id: null, book_id: null }
    await loadData()
  } catch (error) {
    console.error('Erro ao registrar empréstimo:', error)
    alert('Erro ao registrar empréstimo')
  }
}

const handleDeleteLoan = async (loan: Loan) => {
  if (!confirm('Remover este registro de empréstimo? Esta ação não pode ser desfeita.')) {
    return
  }
  try {
    await loanService.deleteLoan(loan.id)
    await loadData()
  } catch (error) {
    console.error('Erro ao remover empréstimo:', error)
    alert('Erro ao remover empréstimo')
  }
}

const isLate = (returnDate: string) => {
  return new Date(returnDate) < new Date()
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-head page-head--row">
      <div>
        <p class="eyebrow">Movimentação</p>
        <h1 class="page-title">Empréstimos.</h1>
        <p class="page-description">Acompanhe e gerencie todos os empréstimos realizados.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="isAddingLoan = true">
        <AppIcon name="plus" :size="16" />
        Novo empréstimo
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="statusFilter" class="filters__select">
        <option value="active">Apenas ativos</option>
        <option value="returned">Apenas devolvidos</option>
        <option value="all">Todos os registros</option>
      </select>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando empréstimos...</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Usuário</th>
            <th>Data de devolução</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in filteredLoans" :key="loan.id">
            <td class="cell-strong">{{ getBookTitle(loan.book_id) }}</td>
            <td>{{ getUserName(loan.user_id) }}</td>
            <td>
              <span :class="{ 'text-error': !loan.returned_at && isLate(loan.return_date) }">
                {{ formatDate(loan.return_date) }}
              </span>
              <span v-if="!loan.returned_at && isLate(loan.return_date)" class="badge badge-error late-tag">
                Atrasado
              </span>
            </td>
            <td>
              <span v-if="loan.returned_at" class="badge badge-neutral">
                Devolvido em {{ formatDate(loan.returned_at) }}
              </span>
              <span v-else class="badge badge-success">Em posse</span>
            </td>
            <td>
              <div class="row-actions">
                <button
                  v-if="!loan.returned_at"
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="handleReturn(loan.id!)"
                >
                  <AppIcon name="check" :size="15" />
                  Registrar devolução
                </button>
                <button type="button" class="btn btn-danger btn-sm" @click="handleDeleteLoan(loan)">
                  <AppIcon name="trash" :size="15" />
                  Remover
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredLoans.length === 0" class="empty-row">
            <td colspan="5">Nenhum empréstimo encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- New-loan modal -->
    <Teleport to="body">
      <div v-if="isAddingLoan" class="modal-backdrop" @click.self="isAddingLoan = false">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleAddLoan">
            <div class="modal-head">
              <span class="modal-title">Registrar empréstimo</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="isAddingLoan = false">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="l-user">Usuário</label>
                <select id="l-user" v-model.number="newLoan.user_id" required>
                  <option :value="null" disabled>Selecione um usuário</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }} ({{ u.email }})
                  </option>
                </select>
              </div>
              <div class="field">
                <label for="l-book">Livro disponível</label>
                <select id="l-book" v-model.number="newLoan.book_id" required>
                  <option :value="null" disabled>Selecione um livro</option>
                  <option v-for="b in availableBooks" :key="b.id" :value="b.id">
                    {{ b.title }} — {{ b.author }}
                  </option>
                </select>
                <span v-if="availableBooks.length === 0" class="field-error">
                  Nenhum livro disponível para empréstimo no momento.
                </span>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="isAddingLoan = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!newLoan.user_id || !newLoan.book_id">
                Registrar empréstimo
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<style scoped>
.filters {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}
.filters__select {
  height: 40px;
  min-width: 200px;
  padding: 0 var(--space-sm);
  background: var(--canvas);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.filters__select:focus {
  border-color: var(--hairline-strong);
  box-shadow: 0 0 0 1px var(--hairline-strong);
}

.late-tag {
  margin-left: var(--space-xs);
}

@media (max-width: 600px) {
  .filters__select {
    width: 100%;
    min-width: 0;
  }
}
</style>
