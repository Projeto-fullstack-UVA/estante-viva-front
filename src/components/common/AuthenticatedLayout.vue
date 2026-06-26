<script setup lang="ts">
import AppHeader from "@/components/common/AppHeader.vue";
</script>

<template>
  <div>
    <AppHeader />
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>
