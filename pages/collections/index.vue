<template></template>
<script setup lang="ts">
const route = useRoute();
watch(
  () => route.path,
  (newVal) => {
    if (!route.params.table)
      return navigateTo(`/collections/create`, {
        replace: true,
      });
  },
  { immediate: true }
);
</script>
