<template>
  <div class="flex gap-2">
    <!-- Component actions -->
    <template v-for="action in visibleComponentActions" :key="action.key || action.id">
      <PermissionGate :condition="action.permission">
        <component
          :is="action.component"
          v-bind="action.props"
        />
      </PermissionGate>
    </template>

    <!-- Regular button actions -->
    <template v-for="action in visibleButtonActions" :key="action.id">
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

  // Filter for right side only (header actions are on the right by default)
  return filtered.filter(action => action.side === 'right' || !action.side);
});

const visibleComponentActions = computed(() => {
  return visibleActions.value.filter(action => action.component);
});

const visibleButtonActions = computed(() => {
  return visibleActions.value.filter(action => !action.component);
});

const handleActionClick = (action: HeaderAction) => {
  if (action.submit) {
    action.submit();
  } else if (action.onClick) {
    action.onClick();
  }
};
</script>
