<template>
  <slot v-if="hasPermission" />
</template>

<script setup lang="ts">
import type { PermissionCondition } from "~/composables/usePermissions";

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
const { me } = useAuth();

const hasPermission = computed(() => {
  // Root admin always has access
  if (me.value?.isRootAdmin) {
    return true;
  }

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

  // If no permission is specified, show by default (for items like extensions that don't need specific permissions)
  return true;
});
</script>
