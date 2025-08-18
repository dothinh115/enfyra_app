<script setup lang="ts">
withDefaults(defineProps<{
  count?: number;
  animated?: boolean;
}>(), {
  count: 12,
  animated: true
});
</script>

<template>
  <div class="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
    <div
      v-for="i in count"
      :key="i"
      class="group flex flex-col items-center relative p-2"
      :class="{ 'animate-pulse': animated }"
    >
      <!-- Skeleton Icon -->
      <div class="relative mb-2">
        <div class="w-[120px] h-[120px] bg-gray-200/40 dark:bg-gray-700/40 rounded-xl"></div>
      </div>
      
      <!-- Skeleton Name -->
      <div class="text-center w-full mt-2">
        <div class="h-4 bg-gray-200/40 dark:bg-gray-700/40 rounded-md w-20 mx-auto"></div>
      </div>
    </div>
  </div>
</template>