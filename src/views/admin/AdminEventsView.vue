<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/common/AdminLayout.vue'
import { eventService, institutionService } from '@/services'
import { formatDate } from '@/utils'
import AppIcon from '@/components/common/AppIcon.vue'
import type { Event, Institution } from '@/types'

const events = ref<Event[]>([])
const institutions = ref<Institution[]>([])
const isLoading = ref(true)
const searchFilter = ref('')
const isAddingEvent = ref(false)

const newEvent = ref({
  name: '',
  description: '',
  location: '',
  date: '',
  institution_id: '' as number | '',
})

const institutionNames = computed(() => {
  const map = new Map<number, string>()
  institutions.value.forEach((i) => map.set(i.id, i.name))
  return map
})

const institutionName = (id: number): string => institutionNames.value.get(id) ?? '—'

const loadData = async () => {
  try {
    isLoading.value = true
    ;[events.value, institutions.value] = await Promise.all([
      eventService.getAllEvents(),
      institutionService.getAllInstitutions(),
    ])
  } catch (error) {
    console.error('Erro ao carregar eventos:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredEvents = computed(() => {
  const term = searchFilter.value.toLowerCase()
  return events.value.filter((e) => {
    if (term === '') return true
    return (
      e.name.toLowerCase().includes(term) ||
      e.location.toLowerCase().includes(term) ||
      institutionName(e.institution_id).toLowerCase().includes(term)
    )
  })
})

const resetForm = () => {
  newEvent.value = { name: '', description: '', location: '', date: '', institution_id: '' }
}

const handleAddEvent = async () => {
  if (newEvent.value.institution_id === '') return
  try {
    await eventService.createEvent({
      name: newEvent.value.name,
      description: newEvent.value.description,
      location: newEvent.value.location,
      date: newEvent.value.date,
      institution_id: newEvent.value.institution_id,
    })
    isAddingEvent.value = false
    resetForm()
    await loadData()
  } catch (error) {
    console.error('Erro ao adicionar evento:', error)
    alert('Erro ao adicionar evento')
  }
}

const handleDeleteEvent = async (event: Event) => {
  if (!confirm(`Remover o evento "${event.name}"? Esta ação não pode ser desfeita.`)) {
    return
  }
  try {
    await eventService.deleteEvent(event.id)
    await loadData()
  } catch (error) {
    console.error('Erro ao remover evento:', error)
    alert('Erro ao remover evento')
  }
}

onMounted(loadData)
</script>

<template>
  <AdminLayout>
    <div class="page-head page-head--row">
      <div>
        <p class="eyebrow">Agenda</p>
        <h1 class="page-title">Eventos.</h1>
        <p class="page-description">Gerencie os eventos das instituições parceiras.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="isAddingEvent = true">
        <AppIcon name="plus" :size="16" />
        Novo evento
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input v-model="searchFilter" type="text" placeholder="Buscar por nome, local ou instituição..." />
      </div>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">Carregando eventos...</div>

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Local</th>
            <th>Data</th>
            <th>Instituição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in filteredEvents" :key="event.id">
            <td>
              <div class="book-cell">
                <span class="book-cell__icon"><AppIcon name="calendar" :size="16" /></span>
                <span class="cell-strong">{{ event.name }}</span>
              </div>
            </td>
            <td>{{ event.location || '—' }}</td>
            <td>{{ event.date ? formatDate(event.date) : '—' }}</td>
            <td>{{ institutionName(event.institution_id) }}</td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-danger btn-sm" @click="handleDeleteEvent(event)">
                  <AppIcon name="trash" :size="15" />
                  Remover
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredEvents.length === 0" class="empty-row">
            <td colspan="5">Nenhum evento encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add-event modal -->
    <Teleport to="body">
      <div v-if="isAddingEvent" class="modal-backdrop" @click.self="isAddingEvent = false">
        <div class="modal" role="dialog" aria-modal="true">
          <form @submit.prevent="handleAddEvent">
            <div class="modal-head">
              <span class="modal-title">Adicionar novo evento</span>
              <button type="button" class="modal-close" aria-label="Fechar" @click="isAddingEvent = false">
                <AppIcon name="x" />
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label for="ev-name">Nome</label>
                <input id="ev-name" v-model="newEvent.name" type="text" required placeholder="Nome do evento" />
              </div>
              <div class="field">
                <label for="ev-description">Descrição</label>
                <textarea id="ev-description" v-model="newEvent.description" rows="3" placeholder="Descreva o evento" />
              </div>
              <div class="field">
                <label for="ev-location">Local</label>
                <input id="ev-location" v-model="newEvent.location" type="text" placeholder="Onde acontecerá" />
              </div>
              <div class="field">
                <label for="ev-date">Data</label>
                <input id="ev-date" v-model="newEvent.date" type="date" required />
              </div>
              <div class="field">
                <label for="ev-institution">Instituição</label>
                <select id="ev-institution" v-model="newEvent.institution_id" required>
                  <option value="" disabled>Selecione uma instituição</option>
                  <option v-for="institution in institutions" :key="institution.id" :value="institution.id">
                    {{ institution.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-secondary" @click="isAddingEvent = false">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar evento</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
