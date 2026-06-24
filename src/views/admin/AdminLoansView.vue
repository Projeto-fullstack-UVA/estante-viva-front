<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { loanService, userService, bookService } from '@/services'
import { formatDate } from '@/utils'
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
    <div class="page-header">
      <div>
        <h1 class="page-title">Empréstimos</h1>
        <p class="page-description">Acompanhe e gerencie todos os empréstimos realizados.</p>
      </div>
      <button @click="isAddingLoan = true" class="btn">
        <span>+</span> Novo Empréstimo
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <select v-model="statusFilter" class="status-select">
        <option value="active">Apenas Ativos</option>
        <option value="returned">Apenas Devolvidos</option>
        <option value="all">Todos os Registros</option>
      </select>
    </div>

    <div v-if="isLoading" class="loading-state">
      Carregando empréstimos...
    </div>

    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Livro</th>
            <th>Usuário</th>
            <th>Data de Devolução</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in filteredLoans" :key="loan.id">
            <td>
              <div class="book-info">
                <span class="book-title">{{ getBookTitle(loan.book_id) }}</span>
              </div>
            </td>
            <td>{{ getUserName(loan.user_id) }}</td>
            <td>
              <div :class="{ 'text-red': !loan.returned_at && isLate(loan.return_date) }">
                {{ formatDate(loan.return_date) }}
                <span v-if="!loan.returned_at && isLate(loan.return_date)" class="late-tag">Atrasado</span>
              </div>
            </td>
            <td>
              <span v-if="loan.returned_at" class="badge badge-gray">
                Devolvido em {{ formatDate(loan.returned_at) }}
              </span>
              <span v-else class="badge badge-green">
                Em posse
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button
                  v-if="!loan.returned_at"
                  @click="handleReturn(loan.id!)"
                  class="btn secondary small"
                >
                  Registrar Devolução
                </button>
                <button @click="handleDeleteLoan(loan)" class="btn danger small">
                  Remover
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredLoans.length === 0">
            <td colspan="5" class="empty-table">Nenhum empréstimo encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Novo Empréstimo -->
    <div v-if="isAddingLoan" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Registrar Empréstimo</h2>
          <button @click="isAddingLoan = false" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleAddLoan" class="modal-form">
          <div class="form-group">
            <label>Usuário</label>
            <select v-model.number="newLoan.user_id" required>
              <option :value="null" disabled>Selecione um usuário</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.email }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Livro disponível</label>
            <select v-model.number="newLoan.book_id" required>
              <option :value="null" disabled>Selecione um livro</option>
              <option v-for="b in availableBooks" :key="b.id" :value="b.id">
                {{ b.title }} — {{ b.author }}
              </option>
            </select>
            <p v-if="availableBooks.length === 0" class="status-note">
              Nenhum livro disponível para empréstimo no momento.
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" @click="isAddingLoan = false" class="btn secondary">Cancelar</button>
            <button type="submit" class="btn" :disabled="!newLoan.user_id || !newLoan.book_id">
              Registrar Empréstimo
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
}

.filters-bar {
  margin-bottom: 1.5rem;
}

.status-select {
  width: 200px;
}

.table-container {
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background: var(--gray-50);
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--gray-500);
  border-bottom: 1px solid var(--gray-200);
}

.admin-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.book-title {
  font-weight: 600;
  color: var(--gray-900);
}

.badge-gray {
  background: var(--gray-100);
  color: var(--gray-600);
}

.text-red {
  color: #ef4444;
  font-weight: 600;
}

.late-tag {
  font-size: 0.7rem;
  background: #fef2f2;
  color: #ef4444;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  text-transform: uppercase;
}

.empty-table {
  text-align: center;
  padding: 3rem !important;
  color: var(--gray-500);
}

.loading-state {
  padding: 3rem;
  text-align: center;
  color: var(--gray-500);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: var(--gray-900);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>
