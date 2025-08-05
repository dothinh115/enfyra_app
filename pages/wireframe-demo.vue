<script setup lang="ts">
const currentDemo = ref('form');
const showNavigation = ref(true);

const demos = [
  { key: 'form', label: 'Form Loading', icon: 'i-lucide-edit' },
  { key: 'table', label: 'Table Loading', icon: 'i-lucide-table' },
  { key: 'content', label: 'Content Loading', icon: 'i-lucide-file-text' },
  { key: 'page', label: 'Page Loading', icon: 'i-lucide-layout-dashboard' },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Demo Controls -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold">Loading Wireframe Demo</h1>
          <UToggle v-model="showNavigation" label="Show Navigation" />
        </div>
      </template>

      <!-- Demo Selector -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UButton
          v-for="demo in demos"
          :key="demo.key"
          :variant="currentDemo === demo.key ? 'solid' : 'outline'"
          :icon="demo.icon"
          @click="currentDemo = demo.key"
          block
        >
          {{ demo.label }}
        </UButton>
      </div>
    </UCard>

    <!-- Demo Display -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon :name="demos.find(d => d.key === currentDemo)?.icon || 'i-lucide-eye'" />
          <span>{{ demos.find(d => d.key === currentDemo)?.label }} Preview</span>
        </div>
      </template>

      <!-- Wireframe Component -->
      <LoadingWireframe 
        :type="currentDemo as any"
        :show-navigation="showNavigation"
      />
    </UCard>

    <!-- Loading Examples -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Loading Spinner Examples</h2>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- iOS Crescent -->
        <div class="text-center space-y-3">
          <div class="text-sm font-medium text-gray-700">iOS Crescent</div>
          <div class="flex justify-center">
            <div class="relative w-8 h-8">
              <svg class="w-8 h-8 animate-spin" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12" 
                  fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Material Ring -->
        <div class="text-center space-y-3">
          <div class="text-sm font-medium text-gray-700">Material Ring</div>
          <div class="flex justify-center">
            <div class="relative w-8 h-8">
              <svg class="w-8 h-8 animate-spin" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#6366F1" stroke-width="2" fill="none" 
                  stroke-dasharray="60" stroke-dashoffset="40" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Breathing Dots -->
        <div class="text-center space-y-3">
          <div class="text-sm font-medium text-gray-700">Breathing Dots</div>
          <div class="flex justify-center gap-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" style="animation-delay: 0ms;"></div>
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" style="animation-delay: 200ms;"></div>
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" style="animation-delay: 400ms;"></div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>