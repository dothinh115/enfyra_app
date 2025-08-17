<template>
  <div
    class="h-12 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
    :class="isTablet ? 'px-4' : 'px-6'"
  >
    <div class="flex items-center gap-3">
      <!-- Back Button -->
      <UButton
        icon="lucide:arrow-left"
        variant="soft"
        color="primary"
        @click="goBack"
        label="Back"
        :disabled="disableBack"
        :size="isTablet ? 'sm' : 'md'"
      />
      
      <!-- Left Side Actions (after back button) -->
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
const router = useRouter();
const { isTablet } = useScreen();
const { subHeaderActions } = useSubHeaderActionRegistry();


// Calculate breadcrumb segments from route
const segments = computed(() => {
  const parts = route.path.split("/").filter(Boolean);
  
  return parts.map((part, i) => {
    const label = decodeURIComponent(part);
    const icon = "lucide:chevron-right";
    const to = "/" + parts.slice(0, i + 1).join("/");
    return { label, icon, to };
  });
});

// Disable back button if only 1 segment (root)
const disableBack = computed(() => segments.value.length <= 1);

function goBack() {
  router.back();
}
</script>