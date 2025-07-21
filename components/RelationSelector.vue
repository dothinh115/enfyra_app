<script setup lang="ts">
const props = defineProps<{
  relationMeta: any;
  selectedIds: any[];
  multiple?: boolean;
  disabled?: boolean;
  allowDelete?: boolean;
}>();

const emit = defineEmits(["apply"]);

const selected = ref<any[]>([...props.selectedIds]);
const data = ref<any[]>([]);
const page = ref(1);
const limit = 10;
const total = ref(0);
const showCreateDrawer = ref(false);
const targetTable = useGlobalState().tables.value.find(
  (t) => t.id === props.relationMeta.targetTable.id
);
const confirmingDeleteId = ref<any>(null);
let confirmTimeout: ReturnType<typeof setTimeout> | null = null;
const detailModal = ref(false);
const detailRecord = ref<Record<string, any>>({});

function handleDeleteClick(item: any) {
  if (confirmingDeleteId.value === item.id) {
    deleteRecord(item.id);
    confirmingDeleteId.value = null;
    if (confirmTimeout) clearTimeout(confirmTimeout);
    return;
  }

  confirmingDeleteId.value = item.id;

  if (confirmTimeout) clearTimeout(confirmTimeout);
  confirmTimeout = setTimeout(() => {
    confirmingDeleteId.value = null;
  }, 3000); // 3 giây để xác nhận
}

async function deleteRecord(id: any) {
  if (!targetTable?.name || props.disabled) return;

  try {
    await useApiLazy(`/${targetTable.name}/${id}`, {
      method: "delete",
    });
    selected.value = selected.value.filter((item) => item.id !== id);
    await fetchData();
  } catch (e) {
    console.error("Lỗi khi xóa bản ghi:", e);
  }
}

watch(
  () => props.selectedIds,
  () => {
    selected.value = [...props.selectedIds];
  }
);

async function fetchData() {
  const { data: item } = await useApiLazy(`/${targetTable?.name}`, {
    query: {
      fields: "*",
      page: page.value,
      limit,
      meta: "totalCount",
      sort: "-createdAt",
    },
  });
  data.value = item.value?.data;
  total.value = item.value?.meta?.totalCount || 0;
}

function toggle(id: any) {
  if (props.disabled) return;
  if (props.multiple) {
    const found = selected.value.find((s) => s.id === id);
    selected.value = found
      ? selected.value.filter((s) => s.id !== id)
      : [...selected.value, { id }];
  } else {
    selected.value = [{ id }];
  }
}

function isSelected(id: any) {
  return selected.value.some((sel) => sel.id === id);
}

function apply() {
  if (props.disabled) return;
  emit("apply", selected.value);
}

function viewDetails(item: any) {
  detailRecord.value = item;
  detailModal.value = true;
}

onMounted(fetchData);
watch(page, fetchData);

function getDisplayLabel(
  item: Record<string, any>,
  tableMeta?: { definition: { fieldType: string; propertyName: string }[] }
): string {
  if (!item || typeof item !== "object") return "";

  // Lấy danh sách relation keys
  const relationKeys = new Set(
    (tableMeta?.definition || [])
      .filter((def) => def.fieldType === "relation")
      .map((def) => def.propertyName)
  );

  // Lọc ra các field không phải relation
  const nonRelationKeys = Object.keys(item).filter(
    (key) => !relationKeys.has(key)
  );

  // Ưu tiên các key phổ biến nhưng chỉ trong non-relation
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

  // Nếu không có key ưu tiên, duyệt toàn bộ non-relation fields còn lại (trừ id)
  for (const key of nonRelationKeys) {
    if (key === "id") continue;
    const val = item[key];
    if (val !== undefined && val !== null) {
      const str = String(val).trim();
      if (str !== "") return str;
    }
  }

  // Nếu không có gì hết
  return item.id ? `ID: ${item.id}` : "";
}
</script>

<template>
  <div class="space-y-4">
    <UButton
      icon="lucide:plus"
      block
      variant="soft"
      color="primary"
      class="w-full"
      @click="showCreateDrawer = true"
      :disabled="props.disabled"
    >
      Thêm bản ghi mới
    </UButton>

    <UButton
      v-for="item in data"
      :key="item.id"
      class="w-full px-4 py-3 hover:bg-muted flex items-center justify-between"
      @click.stop="toggle(item.id)"
      variant="outline"
      :color="isSelected(item.id) ? 'primary' : 'neutral'"
    >
      <div class="truncate flex items-center gap-2">
        <Icon v-if="isSelected(item.id)" name="lucide:check" class="w-4 h-4" />
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
          v-if="props.allowDelete"
          @click.stop="handleDeleteClick(item)"
          :label="confirmingDeleteId === item.id ? 'Confirm' : undefined"
        />
      </div>
    </UButton>

    <div class="flex justify-between pt-2">
      <div class="text-xs text-muted-foreground flex gap-2 items-center">
        Page {{ page }} / {{ Math.ceil(total / limit) || 1 }}
        <UButton
          icon="i-lucide-chevron-left"
          size="xs"
          @click="page--"
          :disabled="page <= 1"
        />
        <UButton
          icon="i-lucide-chevron-right"
          size="xs"
          @click="page++"
          :disabled="page >= Math.ceil(total / limit)"
        />
      </div>
      <UButton
        icon="lucide:check"
        @click="apply"
        color="primary"
        size="sm"
        :disabled="props.disabled"
      >
        Apply
      </UButton>
    </div>
  </div>

  <RelationCreateDrawer
    v-model="showCreateDrawer"
    :relation-meta="props.relationMeta"
    @created="fetchData"
    v-model:selected="selected"
  />

  <RelationDetailDrawer
    v-model="detailModal"
    :record="detailRecord"
    :table-name="targetTable?.name"
  />
</template>
