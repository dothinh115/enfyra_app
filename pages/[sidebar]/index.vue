<template>
  <CommonDynamicComponent :full-path="fullPath" />
</template>

<script setup lang="ts">
const route = useRoute();
const sidebarParam = route.params.sidebar;

const fullPath = computed(() => `${sidebarParam}`);
</script>