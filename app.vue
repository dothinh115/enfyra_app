<template>
  <UApp>
    <!-- Global Loading Overlay for First Load -->
    <div 
      v-if="globalLoading" 
      class="fixed inset-0 bg-background flex items-center justify-center z-50"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
          <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <p class="text-muted-foreground text-sm">Loading application...</p>
      </div>
    </div>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
const { globalLoading } = useGlobalState();
</script>
