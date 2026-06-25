<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { institutionService } from '@/services'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Institution } from '@/types'

const institutions = ref<Institution[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const isAddingInstitution = ref(false)

const newInstitution = ref({
  name: '',
  abbreviation: '',
  city: '',
  address: '',
})

const loadData = async () => {
  try {
    isLoading.value = true
    institutions.value = await institutionService.getAllInstitutions()
  } catch (error) {
    console.error('Erro ao carregar instituições:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredInstitutions = computed(() => {
  const term = searchFilter.value.toLowerCase()
  return institutions.value.filter((i) => {
    if (term === '') return true
    return (
      i.name.toLowerCase().includes(term) ||
      i.abbreviation.toLowerCase().includes(term) ||
      i.city.toLowerCase().includes(term)
    )
  })
})

const resetForm = () => {
  newInstitution.value = { name: '', abbreviation: '', city: '', address: '' }
}

const handleAddInstitution = async () => {
  try {
    await institutionService.createInstitution({
      name: newInstitution.value.name,
      abbreviation: newInstitution.value.abbreviation,
      city: newInstitution.value.city,
      address: newInstitution.value.address,
    })
    isAddingInstitution.value = false
    resetForm()
    await loadData()
  } catch (error) {
    console.error('Erro ao adicionar instituição:', error)
    alert('Erro ao adicionar instituição')
  }
}

const handleDeleteInstitution = async (institution: Institution) => {
  if (!confirm(`Remover a instituição "${institution.name}"? Esta ação não pode ser desfeita.`)) {
    return
  }
  try {
    await institutionService.deleteInstitution(institution.id)
    await loadData()
  } catch (error) {
    console.error('Erro ao remover instituição:', error)
    alert('Erro ao remover instituição')
  }
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-head page-head--row">
      <div>
        <p class="eyebrow">Cadastro</p>
        <h1 class="page-title">Instituições.</h1>
        <p class="page-description">Gerencie as instituições parceiras da plataforma.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="isAddingInstitution = true">
        <AppIcon name="plus" :size="16" />
        Nova instituição
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="searchFilter" type="text" placeholder="Buscar por nome, sigla ou cidade..." />
      </div>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando instituições...</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Sigla</th>
            <th>Cidade</th>
            <th>Endereço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="institution in filteredInstitutions" :key="institution.id">
            <td>
              <div class="book-cell">
                <span class="book-cell__icon"><AppIcon name="building" :size="16" /></span>
                <span class="cell-strong">{{ institution.name }}</span>
              </div>
            </td>
            <td>{{ institution.abbreviation || '—' }}</td>
            <td>{{ institution.city || '—' }}</td>
            <td>{{ institution.address || '—' }}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-danger btn-sm" @click="handleDeleteInstitution(institution)">
                  <AppIcon name="trash" :size="15" />
                  Remover
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredInstitutions.length === 0" class="empty-row">
            <td colspan="5">Nenhuma instituição encontrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add-institution modal -->
    <Teleport to="body">
      <div v-if="isAddingInstitution" class="modal-backdrop" @click.self="isAddingInstitution = false">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleAddInstitution">
            <div class="modal-head">
              <span class="modal-title">Adicionar nova instituição</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="isAddingInstitution = false">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="inst-name">Nome</label>
                <input id="inst-name" v-model="newInstitution.name" type="text" required placeholder="Nome da instituição" />
              </div>
              <div class="field">
                <label for="inst-abbreviation">Sigla</label>
                <input id="inst-abbreviation" v-model="newInstitution.abbreviation" type="text" required placeholder="Ex.: UVA" />
              </div>
              <div class="field">
                <label for="inst-city">Cidade</label>
                <input id="inst-city" v-model="newInstitution.city" type="text" required placeholder="Cidade" />
              </div>
              <div class="field">
                <label for="inst-address">Endereço</label>
                <input id="inst-address" v-model="newInstitution.address" type="text" required placeholder="Endereço completo" />
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="isAddingInstitution = false">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar instituição</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
