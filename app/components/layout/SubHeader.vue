<template>
  <div
    class="h-12 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
    :class="isTablet ? 'px-4' : 'px-6'"
  >
    <div class="flex items-center gap-3">
      <!-- Left Side Actions -->
      <!-- Component actions -->
      <component
        v-for="action in subHeaderActions.filter(a => a.component && a.side === 'left')"
        :key="action.key || action.id"
        :is="action.component"
        v-bind="action.props"
      />

      <!-- Regular button actions -->
      <UButton
        v-for="action in subHeaderActions.filter(a => !a.component && a.side === 'left')"
        :key="action.id"
        :icon="action.icon"
        :label="action.label"
        :variant="action.variant || 'soft'"
        :color="action.color || 'neutral'"
        :size="action.size || (isTablet ? 'sm' : 'md')"
        :disabled="typeof action.disabled === 'boolean' ? action.disabled : unref(action.disabled)"
        @click="action.onClick"
        :class="action.class"
      />
    </div>

    <!-- Right Side Actions -->
    <div class="flex items-center gap-2">
      <!-- Component actions -->
      <component
        v-for="action in subHeaderActions.filter(a => a.component && a.side === 'right')"
        :key="action.key || action.id"
        :is="action.component"
        v-bind="action.props"
        @vue:mounted="console.log('🚀 Component mounted with key:', action.key || action.id)"
        @vue:updated="console.log('🔄 Component updated with key:', action.key || action.id)"
      />

      <!-- Regular button actions -->
      <UButton
        v-for="action in subHeaderActions.filter(a => !a.component && a.side === 'right')"
        :key="action.id"
        :icon="action.icon"
        :label="action.label"
        :variant="action.variant || 'soft'"
        :color="action.color || 'neutral'"
        :size="action.size || (isTablet ? 'sm' : 'md')"
        :disabled="typeof action.disabled === 'boolean' ? action.disabled : unref(action.disabled)"
        @click="action.onClick"
        :class="action.class"
      />
      
      <!-- Fallback slot for manual actions -->
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { isTablet } = useScreen();
const { subHeaderActions } = useSubHeaderActionRegistry();

// Debug sub header actions
watch(subHeaderActions, (actions) => {
  console.log('🎯 SubHeader actions updated:', actions.map(a => ({ 
    id: a.id, 
    key: a.key, 
    hasComponent: !!a.component,
    side: a.side 
  })));
}, { immediate: true, deep: true });
</script>