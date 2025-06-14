<template>
  <div
    class="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xs"
  >
    {{ props.name }}
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ name?: string }>(), { name: "D" });
</script>
