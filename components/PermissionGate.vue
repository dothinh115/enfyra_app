<template>
  <div v-if="hasPermission" class="w-full">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type {
  PermissionRule,
  PermissionCondition,
} from "~/composables/usePermissions";

interface Props {
  // Legacy props for backward compatibility
  actions?: string[];
  routes?: string[];
  mode?: "any" | "all";

  // New flexible permission condition
  condition?: PermissionCondition;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "any",
});

const { hasAnyPermission, hasAllPermissions, checkPermissionCondition } =
  usePermissions();

const hasPermission = computed(() => {
  // Use new condition-based approach if provided
  if (props.condition) {
    return checkPermissionCondition(props.condition);
  }

  // Fallback to legacy approach
  if (props.routes && props.actions) {
    if (props.mode === "all") {
      return hasAllPermissions(props.routes, props.actions);
    } else {
      return hasAnyPermission(props.routes, props.actions);
    }
  }

  return false;
});
</script>
