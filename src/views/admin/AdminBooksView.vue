<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { bookService } from '@/services'
import { formatDate, getStatusLabel } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Book } from '@/types'

const books = ref<Book[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const statusFilter = ref<'all' | 'available' | 'lent'>('all')
const isAddingBook = ref(false)

const newBook = ref({
  title: '',
  author: '',
  release_date: new Date().toISOString().split('T')[0] as string,
  edition: '',
  status: 'available' as 'available' | 'lent',
})

const editingBook = ref<Book | null>(null)
const editForm = ref({
  title: '',
  author: '',
  release_date: '' as string,
  edition: '',
  status: 'available' as 'available' | 'lent',
})

const loadBooks = async () => {
  try {
    isLoading.value = true
    books.value = await bookService.getAllBooks()
  } catch (error) {
    console.error('Erro ao carregar livros:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredBooks = computed(() => {
  return books.value.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
      b.author.toLowerCase().includes(searchFilter.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || b.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const handleAddBook = async () => {
  try {
    await bookService.createBook({
      title: newBook.value.title,
      author: newBook.value.author,
      release_date: newBook.value.release_date,
      edition: newBook.value.edition || undefined,
      status: newBook.value.status,
      created_at: new Date().toISOString(),
    })

    isAddingBook.value = false
    newBook.value = {
      title: '',
      author: '',
      release_date: new Date().toISOString().split('T')[0] as string,
      edition: '',
      status: 'available',
    }
    await loadBooks()
  } catch (error) {
    console.error('Erro ao adicionar livro:', error)
    alert('Erro ao adicionar livro')
  }
}

const openEditBook = (book: Book) => {
  editingBook.value = book
  editForm.value = {
    title: book.title,
    author: book.author,
    release_date: (book.release_date ?? '').split('T')[0] ?? '',
    edition: book.edition ?? '',
    status: book.status,
  }
}

const handleEditBook = async () => {
  if (!editingBook.value) return
  try {
    await bookService.updateBook(editingBook.value.id, {
      title: editForm.value.title,
      author: editForm.value.author,
      release_date: editForm.value.release_date,
      edition: editForm.value.edition || undefined,
      status: editForm.value.status,
    })
    editingBook.value = null
    await loadBooks()
  } catch (error) {
    console.error('Erro ao atualizar livro:', error)
    alert('Erro ao atualizar livro')
  }
}

const handleDeleteBook = async (book: Book) => {
  if (!confirm(`Remover o livro "${book.title}"? Esta ação também remove seus empréstimos e não pode ser desfeita.`)) {
    return
  }
  try {
    await bookService.deleteBook(book.id)
    await loadBooks()
  } catch (error) {
    console.error('Erro ao remover livro:', error)
    alert('Erro ao remover livro')
  }
}

onMounted(loadBooks)
</script>

<template>
  <AdminLayout>
    <div class="page-head page-head--row">
      <div>
        <p class="eyebrow">Acervo</p>
        <h1 class="page-title">Livros.</h1>
        <p class="page-description">Gerencie o acervo de livros da biblioteca.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="isAddingBook = true">
        <AppIcon name="plus" :size="16" />
        Novo livro
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="searchFilter" type="text" placeholder="Buscar por título ou autor..." />
      </div>
      <select v-model="statusFilter" class="filters__select">
        <option value="all">Todos os status</option>
        <option value="available">Disponível</option>
        <option value="lent">Emprestado</option>
      </select>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando livros...</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Edição</th>
            <th>Lançamento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in filteredBooks" :key="book.id">
            <td>
              <div class="book-cell">
                <span class="book-cell__icon"><AppIcon name="book" :size="16" /></span>
                <span class="cell-strong">{{ book.title }}</span>
              </div>
            </td>
            <td>{{ book.author }}</td>
            <td>{{ book.edition || '—' }}</td>
            <td>{{ formatDate(book.release_date) }}</td>
            <td>
              <span class="badge" :class="book.status === 'available' ? 'badge-success' : 'badge-warning'">
                {{ getStatusLabel(book.status) }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-secondary btn-sm" @click="openEditBook(book)">
                  <AppIcon name="pencil" :size="15" />
                  Editar
                </button>
                <button type="button" class="btn btn-danger btn-sm" @click="handleDeleteBook(book)">
                  <AppIcon name="trash" :size="15" />
                  Remover
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredBooks.length === 0" class="empty-row">
            <td colspan="6">Nenhum livro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add-book modal -->
    <Teleport to="body">
      <div v-if="isAddingBook" class="modal-backdrop" @click.self="isAddingBook = false">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleAddBook">
            <div class="modal-head">
              <span class="modal-title">Adicionar novo livro</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="isAddingBook = false">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="b-title">Título</label>
                <input id="b-title" v-model="newBook.title" type="text" required placeholder="Título do livro" />
              </div>
              <div class="field">
                <label for="b-author">Autor</label>
                <input id="b-author" v-model="newBook.author" type="text" required placeholder="Nome do autor" />
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="b-date">Data de lançamento</label>
                  <input id="b-date" v-model="newBook.release_date" type="date" required />
                </div>
                <div class="field">
                  <label for="b-edition">Edição</label>
                  <input id="b-edition" v-model="newBook.edition" type="text" placeholder="Ex: 1ª edição" />
                </div>
              </div>
              <div class="field">
                <label for="b-status">Status inicial</label>
                <select id="b-status" v-model="newBook.status" required>
                  <option value="available">Disponível</option>
                  <option value="lent">Emprestado</option>
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="isAddingBook = false">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar livro</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Edit-book modal -->
    <Teleport to="body">
      <div v-if="editingBook" class="modal-backdrop" @click.self="editingBook = null">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleEditBook">
            <div class="modal-head">
              <span class="modal-title">Editar livro</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="editingBook = null">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="e-title">Título</label>
                <input id="e-title" v-model="editForm.title" type="text" required placeholder="Título do livro" />
              </div>
              <div class="field">
                <label for="e-author">Autor</label>
                <input id="e-author" v-model="editForm.author" type="text" required placeholder="Nome do autor" />
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="e-date">Data de lançamento</label>
                  <input id="e-date" v-model="editForm.release_date" type="date" required />
                </div>
                <div class="field">
                  <label for="e-edition">Edição</label>
                  <input id="e-edition" v-model="editForm.edition" type="text" placeholder="Ex: 1ª edição" />
                </div>
              </div>
              <div class="field">
                <label for="e-status">Status</label>
                <select id="e-status" v-model="editForm.status" required>
                  <option value="available">Disponível</option>
                  <option value="lent">Emprestado</option>
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="editingBook = null">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar alterações</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
