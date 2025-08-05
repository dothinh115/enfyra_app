<template>
  <div 
    v-if="isMobile" 
    class="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-6"
  >
    <div class="bg-white rounded-lg p-6 max-w-sm text-center shadow-2xl">
      <div class="mb-4">
        <UIcon name="i-lucide-smartphone" class="w-12 h-12 text-orange-500 mx-auto" />
      </div>
      
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Mobile Not Supported
      </h3>
      
      <p class="text-gray-600 text-sm mb-4">
        This admin panel is optimized for desktop and tablet devices. Please use a larger screen for the best experience.
      </p>
      
      <div class="text-xs text-gray-500">
        Minimum screen width: 768px
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useScreen();
</script>