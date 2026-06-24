<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userService, statsService } from '@/services'
import { validateEmail } from '@/utils'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const campusOptions = ['Veiga Barra', 'Veiga Tijuca', 'Veiga Botafogo', 'Veiga Cabo Frio'] as const

const email = ref('')
const name = ref('')
const password = ref('')
const passwordConfirm = ref('')
const campus = ref<(typeof campusOptions)[number] | ''>('')
const address = ref('')
const document = ref('')
const cellphone = ref('')
const birthDate = ref('')
const role = ref<'student' | 'teacher' | 'donator'>('student')
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const stats = ref({ books: 0, users: 0, loans: 0 })

const loadStats = async () => {
  try {
    stats.value = await statsService.getStats()
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err)
  }
}

onMounted(loadStats)

const validateForm = () => {
  errors.value = {}
  submitError.value = null
  if (!email.value.trim()) {
    errors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(email.value)) {
    errors.value.email = 'Email inválido'
  }
  if (!name.value.trim()) {
    errors.value.name = 'O nome é obrigatório'
  }
  if (!campus.value.trim()) {
    errors.value.campus = 'Campus é obrigatório'
  }
  if (!address.value.trim()) {
    errors.value.address = 'Endereço é obrigatório'
  }
  if (!document.value.trim()) {
    errors.value.document = 'CPF é obrigatório'
  } else if (!/^\d{11}$/.test(document.value)) {
    errors.value.document = 'CPF deve conter 11 dígitos (somente números)'
  }
  if (!cellphone.value.trim()) {
    errors.value.cellphone = 'Celular é obrigatório'
  } else if (!/^\d{11}$/.test(cellphone.value)) {
    errors.value.cellphone = 'Celular deve conter 11 dígitos (somente números, com DDD)'
  }
  if (!birthDate.value) {
    errors.value.birthDate = 'Data de nascimento é obrigatória'
  }
  if (!password.value) {
    errors.value.password = 'Senha é obrigatória'
  } else if (password.value.length < 6) {
    errors.value.password = 'Senha deve ter pelo menos 6 caracteres'
  }
  if (!passwordConfirm.value) {
    errors.value.passwordConfirm = 'Confirmação de senha é obrigatória'
  } else if (password.value !== passwordConfirm.value) {
    errors.value.passwordConfirm = 'As senhas não coincidem'
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true
    await userService.createUser({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      campus: campus.value.trim(),
      address: address.value.trim(),
      document: document.value.trim(),
      cellphone: cellphone.value.trim(),
      role: role.value,
      points: 0,
      birthDate: birthDate.value,
    })
    router.push('/login')
  } catch {
    submitError.value = 'Erro ao criar conta. Verifique se o email já está em uso.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <aside class="auth-side">
      <div class="auth-side-logo">
        <div class="auth-side-logo-img">
          <AppLogo />
        </div>
        <span class="auth-side-logo-text">Estante Viva</span>
      </div>
      <h2 class="auth-side-headline">
        Junte-se à nossa<br>comunidade leitora
      </h2>
      <p class="auth-side-sub">
        Cadastre-se gratuitamente e tenha acesso ao acervo completo da biblioteca. Empreste, reserve e acompanhe seus livros favoritos.
      </p>
      <div class="auth-side-stats">
        <div>
          <span class="auth-stat-value">{{ stats.books }}</span>
          <span class="auth-stat-label">Livros</span>
        </div>
        <div>
          <span class="auth-stat-value">{{ stats.users }}</span>
          <span class="auth-stat-label">Usuários</span>
        </div>
        <div>
          <span class="auth-stat-value">Grátis</span>
          <span class="auth-stat-label">Para todos</span>
        </div>
      </div>
    </aside>

    <!-- Lado direito: formulário -->
    <div class="auth-form-side">
      <div class="auth-form-card">
        <div class="auth-form-header">
          <h1>Criar conta</h1>
          <p>Já tem conta? <RouterLink to="/login">Fazer login</RouterLink></p>
        </div>

        <div v-if="submitError" class="callout" role="alert">
          {{ submitError }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="name">Nome completo</label>
            <input id="name" v-model="name" type="text" placeholder="Seu nome completo" />
            <span v-if="errors.name" class="status-note">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" placeholder="seu@email.com" autocomplete="email" />
            <span v-if="errors.email" class="status-note">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="campus">Campus</label>
            <select id="campus" v-model="campus">
              <option value="" disabled>Selecione um campus</option>
              <option v-for="campus in campusOptions" :key="campus" :value="campus">
                {{ campus }}
              </option>
            </select>
            <span v-if="errors.campus" class="status-note">{{ errors.campus }}</span>
          </div>

          <div class="form-group">
            <label for="address">Endereço</label>
            <input id="address" v-model="address" type="text" placeholder="Rua, número, bairro" />
            <span v-if="errors.address" class="status-note">{{ errors.address }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="document">CPF</label>
              <input id="document" v-model="document" type="text" inputmode="numeric" maxlength="11" placeholder="Somente números" />
              <span v-if="errors.document" class="status-note">{{ errors.document }}</span>
            </div>
            <div class="form-group">
              <label for="cellphone">Celular</label>
              <input id="cellphone" v-model="cellphone" type="text" inputmode="numeric" maxlength="11" placeholder="DDD + número" />
              <span v-if="errors.cellphone" class="status-note">{{ errors.cellphone }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="birthDate">Data de nascimento</label>
            <input id="birthDate" v-model="birthDate" type="date" />
            <span v-if="errors.birthDate" class="status-note">{{ errors.birthDate }}</span>
          </div>

          <div class="form-group">
            <label for="role">Perfil de acesso</label>
            <select id="role" v-model="role">
              <option value="student">Aluno</option>
              <option value="teacher">Professor</option>
              <option value="donator">Doador</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Senha</label>
              <input id="password" v-model="password" type="password" placeholder="••••••••" autocomplete="new-password" />
              <span v-if="errors.password" class="status-note">{{ errors.password }}</span>
            </div>
            <div class="form-group">
              <label for="passwordConfirm">Confirmar senha</label>
              <input id="passwordConfirm" v-model="passwordConfirm" type="password" placeholder="••••••••" autocomplete="new-password" />
              <span v-if="errors.passwordConfirm" class="status-note">{{ errors.passwordConfirm }}</span>
            </div>
          </div>

          <button type="submit" class="btn" style="width: 100%; margin-top: 0.5rem;">
            {{ isSubmitting ? 'Criando conta...' : 'Criar conta' }}
          </button>
        </form>

        <div class="auth-form-footer">
          Já tem conta? <RouterLink to="/login">Fazer login</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
