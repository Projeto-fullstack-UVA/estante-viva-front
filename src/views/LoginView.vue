<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/services/auth'
import { validateEmail } from '@/utils'
import AppLogo from '@/components/common/AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotSent = ref(false)

const validateForm = () => {
  errors.value = {}
  submitError.value = null
  if (!email.value.trim()) {
    errors.value.email = 'Email é obrigatório'
  } else if (!validateEmail(email.value)) {
    errors.value.email = 'Email inválido'
  }
  if (!password.value) {
    errors.value.password = 'Senha é obrigatória'
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (isSubmitting.value) return
  try {
    isSubmitting.value = true
    await login({ email: email.value.trim(), password: password.value })
    router.push('/dashboard')
  } catch {
    submitError.value = 'Email ou senha inválidos. Verifique seus dados.'
  } finally {
    isSubmitting.value = false
  }
}

const openForgotPassword = () => {
  showForgotPassword.value = true
}
const closeForgotPassword = () => {
  showForgotPassword.value = false
  forgotEmail.value = ''
  forgotSent.value = false
}
const handleForgotPassword = () => {
  forgotSent.value = true
}
</script>

<template>
  <ThemeToggle class="theme-toggle--floating" />
  <div class="auth">
    <!-- Brand panel (polarity-flipped dark band + mesh gradient) -->
    <aside class="auth-brand">
      <div class="mesh mesh--vivid"></div>
      <div class="auth-brand__top">
        <span class="auth-logo">
          <span class="auth-logo__mark"><AppLogo /></span>
          <span class="auth-logo__name">Estante Viva</span>
        </span>
      </div>
      <div class="auth-brand__inner">
        <p class="auth-eyebrow">Biblioteca comunitária</p>
        <h2 class="auth-headline">Sua biblioteca na palma da mão.</h2>
        <p class="auth-sub">
          Acesse o acervo, faça empréstimos, acompanhe devoluções e gerencie seu histórico de
          leituras com facilidade.
        </p>
        <ul class="auth-features">
          <li class="auth-feature">
            <AppIcon name="check" />
            Explore o acervo e filtre por título, autor ou status.
          </li>
          <li class="auth-feature">
            <AppIcon name="check" />
            Faça empréstimos e acompanhe suas devoluções.
          </li>
          <li class="auth-feature">
            <AppIcon name="check" />
            Doe livros e acumule pontos na comunidade.
          </li>
        </ul>
      </div>
    </aside>

    <!-- Form side -->
    <div class="auth-form">
      <div class="auth-form__inner">
        <span class="auth-form__brand">
          <span class="auth-logo__mark"><AppLogo /></span>
          <span class="auth-logo__name">Estante Viva</span>
        </span>

        <div class="auth-form__head">
          <h1>Bem-vindo de volta.</h1>
          <p>Não tem conta? <RouterLink to="/signup">Cadastre-se grátis</RouterLink></p>
        </div>

        <div v-if="submitError" class="callout" role="alert">
          {{ submitError }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
            />
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <div class="field">
            <label for="password">Senha</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>

          <div class="forgot-row">
            <button type="button" class="link-button" @click="openForgotPassword">
              Esqueceu a senha?
            </button>
          </div>

          <button type="submit" class="btn btn-primary btn-pill btn-lg btn-block" :disabled="isSubmitting">
            {{ isSubmitting ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="auth-form__foot">
          Novo por aqui? <RouterLink to="/signup">Criar conta</RouterLink>
        </div>
      </div>
    </div>
  </div>

  <!-- Forgot-password modal -->
  <Teleport to="body">
    <div v-if="showForgotPassword" class="modal-backdrop" @click.self="closeForgotPassword">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <span class="modal-title">Recuperar senha</span>
          <button type="button" class="modal-close" aria-label="Fechar" @click="closeForgotPassword">
            <AppIcon name="x" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="forgotSent" class="callout callout-info">
            Se o email estiver cadastrado, você receberá as instruções em breve.
          </div>
          <template v-else>
            <p class="modal-lead">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
            <div class="field">
              <label for="forgot-email">Email</label>
              <input id="forgot-email" v-model="forgotEmail" type="email" placeholder="seu@email.com" />
            </div>
          </template>
        </div>
        <div v-if="!forgotSent" class="modal-foot">
          <button type="button" class="btn btn-secondary" @click="closeForgotPassword">Cancelar</button>
          <button type="button" class="btn btn-primary" @click="handleForgotPassword">Enviar link</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
