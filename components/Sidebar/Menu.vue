<script setup lang="ts">
const menu = [
  { label: "Posts", icon: "lucide:pen" },
  { label: "Users", icon: "lucide:user" },
  { label: "Settings", icon: "lucide:settings" },
];
</script>

<template>
  <nav class="flex flex-col space-y-2">
    <UButton
      v-for="item in menu"
      :key="item.label"
      size="md"
      variant="ghost"
      :icon="item.icon"
      class="justify-start w-full text-gray-300"
    >
      {{ item.label }}
    </UButton>
  </nav>
</template>
