<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'text' | 'avatar' | 'card' | 'table' | 'form';
  lines?: number;
  animated?: boolean;
}>(), {
  type: 'text',
  lines: 3,
  animated: true
});

const animationClass = computed(() => props.animated ? 'animate-pulse' : '');
</script>

<template>
  <!-- Text Skeleton -->
  <div v-if="type === 'text'" class="space-y-2">
    <div 
      v-for="i in lines" 
      :key="i"
      :class="[
        'h-4 bg-gray-200 dark:bg-gray-700 rounded',
        animationClass,
        i === lines ? 'w-3/4' : 'w-full'
      ]"
    ></div>
  </div>

  <!-- Avatar Skeleton -->
  <div v-else-if="type === 'avatar'" class="flex items-center gap-3">
    <div :class="['w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full', animationClass]"></div>
    <div class="space-y-2 flex-1">
      <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2', animationClass]"></div>
      <div :class="['h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3', animationClass]"></div>
    </div>
  </div>

  <!-- Card Skeleton -->
  <div v-else-if="type === 'card'" class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div v-for="i in 3" :key="i" :class="['p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4', animationClass]">
      <!-- Avatar + Name -->
      <div class="flex items-center gap-3">
        <div :class="['w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full', animationClass]"></div>
        <div class="space-y-1 flex-1">
          <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4', animationClass]"></div>
          <div :class="['h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2', animationClass]"></div>
        </div>
      </div>
      <!-- Content lines -->
      <div class="space-y-2">
        <div :class="['h-3 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
        <div :class="['h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5', animationClass]"></div>
      </div>
      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <div :class="['w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
        <div :class="['w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
      </div>
    </div>
  </div>

  <!-- Table Skeleton -->
  <div v-else-if="type === 'table'" class="w-full space-y-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
    <!-- Header -->
    <div :class="['grid grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50', animationClass]">
      <div v-for="i in 5" :key="i" :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
    </div>
    <!-- Rows -->
    <div class="divide-y divide-gray-200 dark:divide-gray-800">
      <div v-for="i in 8" :key="i" :class="['grid grid-cols-5 gap-4 p-4', animationClass]">
        <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
        <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4', animationClass]"></div>
        <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2', animationClass]"></div>
        <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3', animationClass]"></div>
        <div class="flex gap-2">
          <div :class="['w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
          <div :class="['w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Form Skeleton -->
  <div v-else-if="type === 'form'" class="space-y-4">
    <div v-for="i in 4" :key="i" class="space-y-2">
      <div :class="['h-4 bg-gray-200 dark:bg-gray-700 rounded w-24', animationClass]"></div>
      <div :class="['h-10 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
    </div>
    <div class="flex gap-4 pt-4">
      <div :class="['w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
      <div :class="['w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded', animationClass]"></div>
    </div>
  </div>
</template>