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

  // Helper: safely get a non-empty string from any field
  const getValueAsString = (
    obj: Record<string, any>,
    key: string
  ): string | null => {
    const raw: unknown = obj[key as keyof typeof obj];
    if (raw === undefined || raw === null) return null;
    const str = String(raw).trim();
    return str === "" ? null : str;
  };

  // Get list of relation keys
  const relationKeys = new Set(
    (tableMeta?.definition || [])
      .filter((def) => def.fieldType === "relation")
      .map((def) => def.propertyName)
  );

  // Filter out fields that are not relations
  const nonRelationKeys: string[] = Object.keys(item).filter(
    (key) => !relationKeys.has(key)
  );

  // Prioritize common keys but only in non-relation
  const preferredKeys: string[] = [
    "name",
    "title",
    "propertyName",
    "label",
    "path",
    "method",
    "description",
  ];

  const foundFields: string[] = [];

  // Tìm 2 fields đầu tiên từ preferred keys
  for (const key of preferredKeys) {
    if (!nonRelationKeys.includes(key) || foundFields.length >= 2) continue;
    const str = getValueAsString(item, key);
    if (str) foundFields.push(str);
  }

  // Nếu chưa đủ 2 fields, tìm thêm từ các fields còn lại (bỏ id)
  for (const key of nonRelationKeys) {
    if (key === "id" || foundFields.length >= 2) continue;
    const str = getValueAsString(item, key);
    if (str) foundFields.push(str);
  }

  // Kết hợp 2 fields
  if (foundFields.length === 0) {
    const idStr = getValueAsString(item, "id");
    return idStr ? `ID: ${idStr}` : "";
  } else if (foundFields.length === 1) {
    return foundFields[0] as string;
  } else {
    return `${foundFields[0]} - ${foundFields[1]}`;
  }
}

function shortenId(id: string | number): string {
  if (id === undefined || id === null) return "";
  const str = String(id);
  // Ngắn hơn nữa: 4 ký tự đầu + … + 3 ký tự cuối
  return str.length > 12 ? `${str.slice(0, 4)}…${str.slice(-3)}` : str;
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
    <div class="truncate flex items-center gap-2" :title="String(item.id)">
      <UIcon v-if="isSelected(item.id)" name="lucide:check" class="w-4 h-4" />
      {{ shortenId(item.id) }} - {{ getDisplayLabel(item) }}
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
