<template>
  <div 
    v-if="isMobile" 
    class="fixed inset-0 bg-background/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
  >
    <UCard class="max-w-md w-full">
      <div class="text-center space-y-6">
        <!-- Icon -->
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            <Icon name="lucide:smartphone" class="w-8 h-8 text-warning" />
          </div>
        </div>
        
        <!-- Content -->
        <div class="space-y-3">
          <h3 class="text-xl font-semibold">
            Mobile Not Supported
          </h3>
          
          <p class="text-muted-foreground text-sm leading-relaxed">
            This admin panel is optimized for desktop and tablet devices. Please use a larger screen for the best experience.
          </p>
        </div>
        
        <!-- Requirements -->
        <div class="pt-2 border-t border-muted">
          <div class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon name="lucide:monitor" class="w-4 h-4" />
            <span>Minimum screen width: 768px</span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { isMobile } = useScreen();
</script>