<template>
  <div class="flex gap-2">
    <template v-for="action in visibleActions" :key="action.id">
      <PermissionGate :condition="action.permission">
        <UButton
          :label="isTablet ? undefined : action.label"
          :icon="action.icon"
          :variant="action.variant || 'solid'"
          :color="action.color || 'primary'"
          :size="isTablet ? 'sm' : (action.size || 'md')"
          :loading="unref(action.loading)"
          :disabled="unref(action.disabled)"
          :to="action.to"
          :aria-label="action.label || action.id"
          :class="action.class"
          @click="handleActionClick(action)"
          class="cursor-pointer"
        />
      </PermissionGate>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HeaderAction } from "~/utils/types";

const route = useRoute();
const { headerActions } = useHeaderActionRegistry();
const { isTablet } = useScreen();

const visibleActions = computed(() => {
  const filtered = headerActions.value.filter((action) => {
    const currentPath = route.path;

    if (
      action.hideOn &&
      action.hideOn.some((path) => currentPath.startsWith(path))
    ) {
      return false;
    }

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

const handleActionClick = (action: HeaderAction) => {
  if (action.submit) {
    action.submit();
  } else if (action.onClick) {
    action.onClick();
  }
};
</script>
