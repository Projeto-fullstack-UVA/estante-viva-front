<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { userService, institutionService } from '@/services'
import { formatDate } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { User, Institution } from '@/types'

const users = ref<User[]>([])
const institutions = ref<Institution[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const roleFilter = ref('all')
const isAddingUser = ref(false)

const newUser = ref({
  name: '',
  email: '',
  password: '',
  role: 'student' as 'student' | 'teacher' | 'admin',
  points: 0,
  institution_id: '' as number | '',
  address: '',
  document: '',
  cellphone: '',
  birthDate: ''
})

const institutionName = (id: number | null) => {
  if (id == null) return '—'
  return institutions.value.find((i) => i.id === id)?.name ?? '—'
}

const loadUsers = async () => {
  try {
    isLoading.value = true
    const [userList, institutionList] = await Promise.all([
      userService.getAllUsers(),
      institutionService.getAllInstitutions(),
    ])
    users.value = userList
    institutions.value = institutionList
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    isLoading.value = false
  }
}

const handleAddUser = async () => {
  try {
    await userService.createUser({
      ...newUser.value,
      institution_id: newUser.value.institution_id === '' ? null : newUser.value.institution_id,
    })
    isAddingUser.value = false
    newUser.value = {
      name: '',
      email: '',
      password: '',
      role: 'student',
      points: 0,
      institution_id: '',
      address: '',
      document: '',
      cellphone: '',
      birthDate: ''
    }
    await loadUsers()
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    alert('Erro ao criar usuário')
  }
}

const handleDeleteUser = async (user: User) => {
  if (!confirm(`Remover o usuário "${user.name}"? Esta ação também remove seus empréstimos e não pode ser desfeita.`)) {
    return
  }
  try {
    await userService.deleteUser(user.id)
    await loadUsers()
  } catch (error) {
    console.error('Erro ao remover usuário:', error)
    alert('Erro ao remover usuário')
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchFilter.value.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchFilter.value.toLowerCase())
    const matchesRole = roleFilter.value === 'all' || u.role === roleFilter.value
    return matchesSearch && matchesRole
  })
})

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'admin': 'Administrador',
    'student': 'Estudante',
    'teacher': 'Professor'
  }
  return labels[role] || role
}

onMounted(loadUsers)
</script>

<template>
  <AdminLayout>
    <div class="page-head page-head--row">
      <div>
        <p class="eyebrow">Gestão</p>
        <h1 class="page-title">Usuários.</h1>
        <p class="page-description">Gerencie os usuários cadastrados no sistema.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="isAddingUser = true">
        <AppIcon name="plus" :size="16" />
        Novo usuário
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="searchFilter" type="text" placeholder="Buscar por nome ou email..." />
      </div>
      <select v-model="roleFilter" class="filters__select">
        <option value="all">Todos os cargos</option>
        <option value="admin">Administrador</option>
        <option value="student">Estudante</option>
        <option value="teacher">Professor</option>
      </select>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando usuários...</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Pontos</th>
            <th>Instituição</th>
            <th>Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div class="user-cell">
                <span class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</span>
                <span class="cell-strong">{{ user.name }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="badge" :class="user.role === 'admin' ? 'badge-success' : 'badge-neutral'">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>{{ user.points }}</td>
            <td>{{ institutionName(user.institution_id) }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button type="button" class="btn btn-danger btn-sm" @click="handleDeleteUser(user)">
                <AppIcon name="trash" :size="15" />
                Remover
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0" class="empty-row">
            <td colspan="7">Nenhum usuário encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add-user modal -->
    <Teleport to="body">
      <div v-if="isAddingUser" class="modal-backdrop" @click.self="isAddingUser = false">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleAddUser">
            <div class="modal-head">
              <span class="modal-title">Adicionar novo usuário</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="isAddingUser = false">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="u-name">Nome</label>
                <input id="u-name" v-model="newUser.name" type="text" required placeholder="Nome completo" />
              </div>
              <div class="field">
                <label for="u-email">Email</label>
                <input id="u-email" v-model="newUser.email" type="email" required placeholder="email@exemplo.com" />
              </div>
              <div class="field">
                <label for="u-password">Senha</label>
                <input id="u-password" v-model="newUser.password" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
              </div>
              <div class="field">
                <label for="u-birth">Data de nascimento</label>
                <input id="u-birth" v-model="newUser.birthDate" type="date" required />
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="u-role">Cargo</label>
                  <select id="u-role" v-model="newUser.role" required>
                    <option value="student">Estudante</option>
                    <option value="teacher">Professor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div class="field">
                  <label for="u-points">Pontos iniciais</label>
                  <input id="u-points" v-model.number="newUser.points" type="number" min="0" />
                </div>
              </div>
              <div class="field">
                <label for="u-institution">Instituição</label>
                <select id="u-institution" v-model="newUser.institution_id">
                  <option value="">Sem instituição</option>
                  <option v-for="institution in institutions" :key="institution.id" :value="institution.id">
                    {{ institution.name }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label for="u-address">Endereço</label>
                <input id="u-address" v-model="newUser.address" type="text" required placeholder="Rua, número, bairro" />
              </div>
              <div class="field-row">
                <div class="field">
                  <label for="u-doc">CPF</label>
                  <input id="u-doc" v-model="newUser.document" type="text" required inputmode="numeric" maxlength="11" pattern="\d{11}" placeholder="Somente números" />
                </div>
                <div class="field">
                  <label for="u-cell">Celular</label>
                  <input id="u-cell" v-model="newUser.cellphone" type="text" required inputmode="numeric" maxlength="11" pattern="\d{11}" placeholder="DDD + número" />
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="isAddingUser = false">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar usuário</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
