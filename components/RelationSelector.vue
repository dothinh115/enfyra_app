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
const loading = ref(false);
const showCreateDrawer = ref(false);
const showFilterDrawer = ref(false);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const currentFilter = ref(createEmptyFilter());
const { schemas } = useGlobalState();
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
  loading.value = true;
  try {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    const queryParams: any = {
      fields: "*",
      page: page.value,
      limit,
      meta: "totalCount",
      sort: "-createdAt",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };

    const { data: item } = await useApiLazy(`/${targetTable?.name}`, {
      query: queryParams,
    });
    data.value = item.value?.data;
    total.value = item.value?.meta?.totalCount || 0;
  } catch (error) {
    console.error("Error fetching relation data:", error);
  } finally {
    loading.value = false;
  }
}

function toggle(id: any) {
  if (props.disabled) return;
  if (props.multiple) {
    const found = selected.value.find((s) => s.id === id);
    selected.value = found
      ? selected.value.filter((s) => s.id !== id)
      : [...selected.value, { id }];
  } else {
    // For single select: if already selected, deselect; otherwise select
    const isCurrentlySelected = selected.value.some((s) => s.id === id);
    selected.value = isCurrentlySelected ? [] : [{ id }];
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

function applyFilter() {
  page.value = 1; // Reset to first page when filter changes
  fetchData();
}

function clearFilter() {
  currentFilter.value = createEmptyFilter();
  applyFilter();
}

function openFilterDrawer() {
  showFilterDrawer.value = true;
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
    <!-- Header with Filter and Create buttons -->
    <div class="flex gap-2 justify-between">
      <UButton
        icon="i-lucide-filter"
        :variant="hasActiveFilters(currentFilter) ? 'solid' : 'outline'"
        :color="hasActiveFilters(currentFilter) ? 'primary' : 'neutral'"
        @click="openFilterDrawer"
        size="sm"
      >
        {{
          hasActiveFilters(currentFilter)
            ? `Filtered (${currentFilter.conditions.length})`
            : "Filter"
        }}
      </UButton>
      
      <UButton
        icon="lucide:plus"
        variant="soft"
        color="primary"
        size="sm"
        @click="showCreateDrawer = true"
        :disabled="props.disabled"
      >
        Add New
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-8 gap-3">
      <div class="relative">
        <div class="w-8 h-8 border-2 border-primary/20 rounded-full"></div>
        <div class="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-muted-foreground">Loading relations...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && data.length === 0" class="flex flex-col items-center justify-center py-8 gap-3">
      <Icon name="lucide:database" class="w-12 h-12 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ hasActiveFilters(currentFilter) ? 'No relations found with current filters' : 'No relations available' }}
      </p>
      <UButton
        v-if="hasActiveFilters(currentFilter)"
        icon="lucide:x"
        variant="soft"
        size="sm"
        @click="clearFilter"
      >
        Clear filters
      </UButton>
    </div>

    <!-- Data List -->
    <UButton
      v-else
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
          :disabled="page <= 1 || loading"
        />
        <UButton
          icon="i-lucide-chevron-right"
          size="xs"
          @click="page++"
          :disabled="page >= Math.ceil(total / limit) || loading"
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

  <!-- Filter Drawer -->
  <FilterDrawer
    v-model="showFilterDrawer"
    v-model:filter-value="currentFilter"
    :schemas="schemas"
    :table-name="targetTable?.name || ''"
    @apply="applyFilter"
    @clear="clearFilter"
  />
</template>
