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
const page = ref(1);
const limit = 10;
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
  }, 3000); // 3 seconds to confirm
}

async function deleteRecord(id: any) {
  if (!targetTable?.name || props.disabled) return;

  // Create a specific instance for this record deletion
  const { execute: removeSpecificRecord } = useApiLazy(
    () => `/${targetTable.name}/${id}`,
    {
      method: "delete",
      errorContext: "Delete Relation Record",
    }
  );

  try {
    await removeSpecificRecord();
    selected.value = selected.value.filter((item) => item.id !== id);
    await fetchData();
  } catch (e) {
    
  }
}

watch(
  () => props.selectedIds,
  () => {
    selected.value = [...props.selectedIds];
  }
);

// API composable for fetching relation data
const {
  data: apiData,
  pending: loading,
  execute: fetchData,
} = useApiLazy(() => `/${targetTable?.name}`, {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      fields: "*",
      page: page.value,
      limit,
      meta: "totalCount",
      sort: "-createdAt",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
  errorContext: "Fetch Relation Data",
});

// Computed values from API data
const data = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

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

function apply() {
  if (props.disabled) return;
  emit("apply", selected.value);
}

function viewDetails(item: any) {
  detailRecord.value = item;
  detailModal.value = true;
}

async function applyFilter() {
  page.value = 1; // Reset to first page when filter changes
  await fetchData();
}

async function clearFilter() {
  currentFilter.value = createEmptyFilter();
  await applyFilter();
}

function openFilterDrawer() {
  showFilterDrawer.value = true;
}

onMounted(() => fetchData());
watch(page, () => fetchData());
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Filter and Create buttons -->
    <RelationActions
      :has-active-filters="hasActiveFilters(currentFilter)"
      :filter-count="currentFilter.conditions.length"
      :disabled="props.disabled"
      @open-filter="openFilterDrawer"
      @open-create="showCreateDrawer = true"
    />

    <!-- Loading State -->
    <CommonLoadingState v-if="loading" type="form" context="inline" size="md" />

    <!-- Empty State -->
    <CommonEmptyState
      v-else-if="!loading && data.length === 0"
      :title="
        hasActiveFilters(currentFilter)
          ? 'No relations found'
          : 'No relations available'
      "
      :description="
        hasActiveFilters(currentFilter)
          ? 'Try adjusting your filters'
          : 'No relations have been created yet'
      "
      icon="lucide:database"
      size="sm"
      :action="
        hasActiveFilters(currentFilter)
          ? {
              label: 'Clear filters',
              onClick: clearFilter,
              icon: 'lucide:x',
            }
          : undefined
      "
    />

    <!-- Data List -->
    <RelationList
      v-else
      :data="data"
      :selected="selected"
      :multiple="props.multiple"
      :disabled="props.disabled"
      :allow-delete="props.allowDelete"
      :confirming-delete-id="confirmingDeleteId"
      @toggle="toggle"
      @view-details="viewDetails"
      @delete-click="handleDeleteClick"
    />

    <RelationPagination
      :page="page"
      :total="total"
      :limit="limit"
      :loading="loading"
      :disabled="props.disabled"
      @update:page="page = $event"
      @apply="apply"
    />
  </div>

  <RelationCreateDrawer
    v-model="showCreateDrawer"
    :relation-meta="props.relationMeta"
    @created="() => fetchData()"
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
    :table-name="targetTable?.name || ''"
    @apply="applyFilter"
    @clear="clearFilter"
  />
</template>
