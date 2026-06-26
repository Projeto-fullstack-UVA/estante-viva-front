<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import TeacherLayout from "@/components/common/TeacherLayout.vue";
import { bookService, eventService } from "@/services";
import { useAuth } from "@/services/auth";
import AppIcon from "@/components/common/AppIcon.vue";
import type { Book, Event } from "@/types";

const { user } = useAuth();

const books = ref<Book[]>([]);
const events = ref<Event[]>([]);
const isLoading = ref(true);

const loadData = async () => {
  try {
    isLoading.value = true;
    const [b, e] = await Promise.all([
      bookService.getAllBooks(),
      eventService.getAllEvents(),
    ]);
    books.value = b;
    events.value = e;
  } catch (error) {
    console.error("Erro ao carregar dados do painel:", error);
  } finally {
    isLoading.value = false;
  }
};

const availableBooksCount = computed(
  () => books.value.filter((b) => b.status === "available").length,
);
const upcomingEventsCount = computed(() => {
  const now = new Date();
  return events.value.filter((e) => e.date && new Date(e.date) >= now).length;
});

onMounted(loadData);
</script>

<template>
  <TeacherLayout>
    <div class="page-head">
      <p class="eyebrow">Visão geral</p>
      <h1 class="page-title">Olá, {{ user?.name ?? "Professor" }}.</h1>
      <p class="page-description">
        Gerencie o acervo de livros e os eventos das instituições parceiras.
      </p>
    </div>

    <div v-if="isLoading" class="callout callout-neutral">
      Carregando estatísticas...
    </div>

    <div v-else>
      <!-- KPIs -->
      <div class="stat-grid">
        <div class="stat">
          <span class="stat__icon"><AppIcon name="book" /></span>
          <span class="stat__label">Total de livros</span>
          <span class="stat__value">{{ books.length }}</span>
        </div>
        <div class="stat">
          <span class="stat__icon"><AppIcon name="check" /></span>
          <span class="stat__label">Livros disponíveis</span>
          <span class="stat__value">{{ availableBooksCount }}</span>
        </div>
        <div class="stat">
          <span class="stat__icon"><AppIcon name="calendar" /></span>
          <span class="stat__label">Total de eventos</span>
          <span class="stat__value">{{ events.length }}</span>
        </div>
        <div class="stat">
          <span class="stat__icon"><AppIcon name="arrow-right" /></span>
          <span class="stat__label">Eventos futuros</span>
          <span class="stat__value">{{ upcomingEventsCount }}</span>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="stat-grid">
        <RouterLink to="/teacher/books" class="card card--link">
          <div class="card-head">
            <div>
              <div class="card-title">Gerenciar livros</div>
              <div class="card-sub">
                Cadastre novos livros e edite o acervo existente.
              </div>
            </div>
            <span class="stat__icon"><AppIcon name="book" /></span>
          </div>
        </RouterLink>
        <RouterLink to="/teacher/events" class="card card--link">
          <div class="card-head">
            <div>
              <div class="card-title">Gerenciar eventos</div>
              <div class="card-sub">
                Crie, edite e remova eventos das instituições.
              </div>
            </div>
            <span class="stat__icon"><AppIcon name="calendar" /></span>
          </div>
        </RouterLink>
      </div>
    </div>
  </TeacherLayout>
</template>
