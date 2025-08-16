<template>
  <header
    class="h-16 border-b border-gray-600 flex items-center justify-between bg-background shrink-0"
    :class="isMobile ? 'px-3' : 'px-6'"
  >
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <CommonBreadCrumbs />
    </div>

    <!-- Action Buttons -->
    <LayoutHeaderActions />
  </header>
</template>

<script setup lang="ts">
const route = useRoute();
const { isMobile } = useScreen();
</script>
