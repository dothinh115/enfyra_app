<script setup lang="ts">
const props = defineProps<{
  data: any[];
  selected: any[];
  multiple?: boolean;
  disabled?: boolean;
  allowDelete?: boolean;
  confirmingDeleteId: any;
  deletePermission?: {
    and?: { route: string; actions: string[] }[];
    or?: { route: string; actions: string[] }[];
  };
}>();

const emit = defineEmits<{
  toggle: [id: any];
  "view-details": [item: any];
  "delete-click": [item: any];
}>();

function toggle(id: any) {
  if (props.disabled) return;
  emit("toggle", id);
}

function isSelected(id: any) {
  return props.selected.some((sel) => sel.id === id);
}

function viewDetails(item: any) {
  emit("view-details", item);
}

function handleDeleteClick(item: any) {
  emit("delete-click", item);
}

const { checkPermissionCondition } = usePermissions();

const canDelete = computed(() => {
  if (!props.allowDelete) return false;
  if (!props.deletePermission) return true; // Allow delete if no permission specified
  return checkPermissionCondition(props.deletePermission);
});

function getDisplayLabel(
  item: Record<string, any>,
  tableMeta?: { definition: { fieldType: string; propertyName: string }[] }
): string {
  if (!item || typeof item !== "object") return "";

  // Get list of relation keys
  const relationKeys = new Set(
    (tableMeta?.definition || [])
      .filter((def) => def.fieldType === "relation")
      .map((def) => def.propertyName)
  );

  // Filter out fields that are not relations
  const nonRelationKeys = Object.keys(item).filter(
    (key) => !relationKeys.has(key)
  );

  // Prioritize common keys but only in non-relation
  const preferredKeys = [
    "name",
    "title",
    "propertyName",
    "path",
    "method",
    "description",
  ];
  for (const key of preferredKeys) {
    if (nonRelationKeys.includes(key)) {
      const val = item[key];
      if (val !== undefined && val !== null) {
        const str = String(val).trim();
        if (str !== "") return str;
      }
    }
  }

  // If no priority key exists, iterate through all remaining non-relation fields (except id)
  for (const key of nonRelationKeys) {
    if (key === "id") continue;
    const val = item[key];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str !== "") return str;
    }
  }

  // If nothing exists
  return item.id ? `ID: ${item.id}` : "";
}
</script>

<template>
  <UButton
    v-for="item in data"
    :key="item.id"
    class="w-full px-4 py-3 hover:bg-muted flex items-center justify-between"
    @click.stop="toggle(item.id)"
    variant="outline"
    :color="isSelected(item.id) ? 'primary' : 'neutral'"
  >
    <div class="truncate flex items-center gap-2">
      <UIcon v-if="isSelected(item.id)" name="lucide:check" class="w-4 h-4" />
      ID: {{ item.id }} - {{ getDisplayLabel(item) }}
    </div>
    <div class="flex gap-1">
      <UButton
        icon="lucide:info"
        size="md"
        variant="outline"
        @click.stop="viewDetails(item)"
      />

      <UButton
        :icon="
          confirmingDeleteId === item.id ? 'lucide:check' : 'lucide:trash-2'
        "
        size="md"
        :color="confirmingDeleteId === item.id ? 'primary' : 'error'"
        variant="outline"
        v-if="canDelete"
        @click.stop="handleDeleteClick(item)"
        :label="confirmingDeleteId === item.id ? 'Confirm' : undefined"
      />
    </div>
  </UButton>
</template>
