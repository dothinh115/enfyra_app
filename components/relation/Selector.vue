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
  }, 3000); // 3 seconds to confirm
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
    console.error("Error when deleting record:", e);
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
    <CommonLoadingState v-if="loading" title="Loading relations..." size="sm" />

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
