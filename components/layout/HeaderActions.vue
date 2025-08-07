<template>
  <div class="flex gap-2">
    <template v-for="action in visibleActions" :key="action.id">
      <PermissionGate :condition="action.permission">
        <UButton
          :label="
            isMobile || action.id.includes('create') ? undefined : action.label
          "
          :icon="action.icon"
          :variant="action.variant || 'solid'"
          :color="action.color || 'primary'"
          :size="isMobile ? 'sm' : action.size || 'md'"
          :loading="unref(action.loading)"
          :disabled="action.disabled"
          :to="action.to"
          :aria-label="action.label || action.id"
          :class="action.class"
          @click="handleActionClick(action)"
        />
      </PermissionGate>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HeaderAction } from "~/composables/useHeaderActionRegistry";

const route = useRoute();
const { headerActions } = useHeaderActionRegistry();
const { isMobile } = useScreen();

// Filter actions based on current route
const visibleActions = computed(() => {
  const filtered = headerActions.value.filter((action) => {
    const currentPath = route.path;

    // Check if action should be hidden on current route
    if (
      action.hideOn &&
      action.hideOn.some((path) => currentPath.startsWith(path))
    ) {
      return false;
    }

    // Check if action should only show on specific routes
    if (
      action.showOn &&
      !action.showOn.some((path) => currentPath.startsWith(path))
    ) {
      return false;
    }

    return true;
  });

  return filtered;
});

// Handle action click
const handleActionClick = (action: HeaderAction) => {
  if (action.submit) {
    // Call the submit function directly
    action.submit();
  } else if (action.onClick) {
    // Call custom onClick handler
    action.onClick();
  }
  // If action has 'to' prop, navigation will be handled by UButton automatically
};
</script>
