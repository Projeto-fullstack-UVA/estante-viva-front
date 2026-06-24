<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { userService } from '@/services'
import { formatDate } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { User } from '@/types'

const users = ref<User[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const roleFilter = ref('all')
const isAddingUser = ref(false)
const campusOptions = ['Veiga Barra', 'Veiga Tijuca', 'Veiga Botafogo', 'Veiga Cabo Frio'] as const

const newUser = ref({
  name: '',
  email: '',
  password: '',
  role: 'student' as 'student' | 'teacher' | 'donator' | 'admin',
  points: 0,
  campus: '' as (typeof campusOptions)[number] | '',
  address: '',
  document: '',
  cellphone: '',
  birthDate: ''
})

const loadUsers = async () => {
  try {
    isLoading.value = true
    users.value = await userService.getAllUsers()
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    isLoading.value = false
  }
}

const handleAddUser = async () => {
  try {
    await userService.createUser({ ...newUser.value })
    isAddingUser.value = false
    newUser.value = {
      name: '',
      email: '',
      password: '',
      role: 'student',
      points: 0,
      campus: '',
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
    'teacher': 'Professor',
    'donator': 'Doador'
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
        <option value="donator">Doador</option>
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
            <th>Campus</th>
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
            <td>{{ user.campus }}</td>
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
                    <option value="donator">Doador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div class="field">
                  <label for="u-points">Pontos iniciais</label>
                  <input id="u-points" v-model.number="newUser.points" type="number" min="0" />
                </div>
              </div>
              <div class="field">
                <label for="u-campus">Campus</label>
                <select id="u-campus" v-model="newUser.campus" required>
                  <option value="" disabled>Selecione um campus</option>
                  <option v-for="campus in campusOptions" :key="campus" :value="campus">
                    {{ campus }}
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

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.user-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: var(--on-primary);
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 600;
}

@media (max-width: 600px) {
  .filters {
    flex-direction: column;
  }
  .search,
  .filters__select {
    min-width: 0;
    width: 100%;
    flex: none;
  }
}
</style>
