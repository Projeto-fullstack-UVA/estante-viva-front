<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AuthenticatedLayout from "@/components/common/AuthenticatedLayout.vue";
import { eventService, institutionService } from "@/services";
import { formatDate } from "@/utils";
import AppIcon from "@/components/common/AppIcon.vue";
import type { Event, Institution } from "@/types";

const isLoading = ref(true);
const error = ref<string | null>(null);
const events = ref<Event[]>([]);
const institutions = ref<Institution[]>([]);
const searchFilter = ref("");

const institutionNames = computed(() => {
  const map = new Map<number, string>();
  institutions.value.forEach((i) => map.set(i.id, i.name));
  return map;
});

const institutionName = (id: number): string =>
  institutionNames.value.get(id) ?? "—";

const loadData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    [events.value, institutions.value] = await Promise.all([
      eventService.getAllEvents(),
      institutionService.getAllInstitutions(),
    ]);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Erro ao carregar eventos";
  } finally {
    isLoading.value = false;
  }
};

const filteredEvents = computed(() => {
  const term = searchFilter.value.toLowerCase();
  return events.value.filter((e) => {
    if (term === "") return true;
    return (
      e.name.toLowerCase().includes(term) ||
      e.location.toLowerCase().includes(term) ||
      institutionName(e.institution_id).toLowerCase().includes(term)
    );
  });
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <AuthenticatedLayout>
    <div class="page-head">
      <p class="eyebrow">Agenda</p>
      <h1 class="page-title">Eventos.</h1>
      <p class="page-description">
        Acompanhe os eventos das instituições parceiras da Estante Viva.
      </p>
    </div>

    <div class="stat-grid">
      <div class="stat">
        <span class="stat__label">Total de eventos</span>
        <span class="stat__value">{{ events.length }}</span>
      </div>
      <div class="stat">
        <span class="stat__label">Resultados</span>
        <span class="stat__value">{{ filteredEvents.length }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search">
        <AppIcon name="search" :size="16" />
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Buscar por nome, local ou instituição..."
        />
      </div>
    </div>

    <div v-if="error" class="callout mb-md">{{ error }}</div>

    <div v-if="isLoading" class="callout callout-neutral">
      Carregando eventos...
    </div>

    <div v-else-if="filteredEvents.length === 0" class="empty">
      <span class="empty-icon"><AppIcon name="calendar" /></span>
      <p>Nenhum evento encontrado.</p>
    </div>

    <div v-else class="book-grid">
      <article
        v-for="event in filteredEvents"
        :key="event.id"
        class="book-card"
      >
        <div class="book-card__top">
          <span class="book-card__icon"
            ><AppIcon name="calendar" :size="20"
          /></span>
        </div>

        <div class="book-card__body">
          <h2 class="book-card__title">{{ event.name }}</h2>
          <p class="book-card__author">
            {{ institutionName(event.institution_id) }}
          </p>
          <p v-if="event.description" class="book-card__meta">
            {{ event.description }}
          </p>
        </div>

        <div class="book-card__foot">
          <p class="book-card__note">
            <span v-if="event.location">{{ event.location }}</span>
            <span v-if="event.location && event.date"> · </span>
            <span v-if="event.date">{{ formatDate(event.date) }}</span>
          </p>
        </div>
      </article>
    </div>
  </AuthenticatedLayout>
</template>
