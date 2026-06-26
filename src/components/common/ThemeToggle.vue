<script setup lang="ts">
import { useTheme } from "@/services/theme";
import AppIcon from "@/components/common/AppIcon.vue";

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'"
    :title="theme === 'dark' ? 'Modo claro' : 'Modo escuro'"
    @click="toggleTheme"
  >
    <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
  </button>
</template>
