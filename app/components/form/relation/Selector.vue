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
const { schemas, tables } = useGlobalState();
const targetTable = computed(() => 
  tables.value.find((t) => t.id === props.relationMeta?.targetTable?.id)
);

// Get schema for the target table - computed to handle reactive props
const targetTableName = computed(() => targetTable.value?.name || '');
const { getIncludeFields, definition } = useSchema(targetTableName);

const confirmingDeleteId = ref<any>(null);
let confirmTimeout: ReturnType<typeof setTimeout> | null = null;
const detailModal = ref(false);
const detailRecord = ref<Record<string, any>>({});

const { isMounted } = useMounted();

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
  if (!targetTable.value?.name || props.disabled) return;

  // Create a specific instance for this record deletion
  const { execute: removeSpecificRecord } = useApiLazy(
    () => `/${targetTable.value?.name}/${id}`,
    {
      method: "delete",
      errorContext: "Delete Relation Record",
    }
  );

  try {
    await removeSpecificRecord();
    selected.value = selected.value.filter((item) => item.id !== id);
    await fetchDataWithValidation();
  } catch (e) {
    console.error("Error deleting record:", e);
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
  error: apiError,
} = useApiLazy(() => `/${targetTable.value?.name}`, {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    const query = {
      fields: getIncludeFields(),
      page: page.value,
      limit,
      meta: "totalCount,filterCount",
      sort: "-createdAt",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };

    return query;
  }),
  errorContext: "Fetch Relation Data",
});

const data = computed(() => {
  return apiData.value?.data || [];
});

const total = computed(() => {
  // Use filterCount when there are active filters, otherwise use totalCount
  const hasFilters = hasActiveFilters(currentFilter.value);
  return hasFilters
    ? apiData.value?.meta?.filterCount || apiData.value?.meta?.totalCount || 0
    : apiData.value?.meta?.totalCount || 0;
});

// Ensure page is valid when total changes
watch(total, (newTotal) => {
  const maxPage = Math.ceil(newTotal / limit);
  if (page.value > maxPage && maxPage > 0) {
    page.value = maxPage;
  }
});

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
  await fetchDataWithValidation();
}

async function clearFilter() {
  currentFilter.value = createEmptyFilter();
  page.value = 1; // Reset to first page when clearing filters
  await fetchDataWithValidation();
}

function openFilterDrawer() {
  showFilterDrawer.value = true;
}

async function fetchDataWithValidation() {
  try {
    await fetchData();

    // Validate page after fetch
    const maxPage = Math.ceil(total.value / limit);
    if (page.value > maxPage && maxPage > 0) {
      page.value = maxPage;
    }
  } catch (error) {
    console.error('Error fetching relation data:', error);
    // Reset to page 1 on error
    if (page.value > 1) {
      page.value = 1;
    }
  }
}

onMounted(() => {
  fetchDataWithValidation();
});

watch(page, async (newPage, oldPage) => {
  if (newPage >= 1 && newPage !== oldPage) {
    await fetchDataWithValidation();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-background/90 to-muted/20 rounded-xl border border-muted/30 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-info to-success flex items-center justify-center shadow-md">
            <UIcon name="lucide:git-fork" class="text-xs text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">Relations</h3>
            <p class="text-sm text-muted-foreground">{{ targetTable?.name || 'Unknown' }} records</p>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <FormRelationActions
          :has-active-filters="hasActiveFilters(currentFilter)"
          :filter-count="currentFilter.conditions.length"
          :disabled="props.disabled"
          @open-filter="openFilterDrawer"
          @open-create="showCreateDrawer = true"
        />
      </div>
      
      <!-- Selected Count -->
      <div v-if="selected.length > 0" class="flex items-center gap-2">
        <UBadge variant="soft" color="primary" size="sm">
          {{ selected.length }} selected
        </UBadge>
        <span class="text-xs text-muted-foreground">
          {{ props.multiple ? 'Multiple selection enabled' : 'Single selection' }}
        </span>
      </div>
    </div>

    <!-- Content Section -->
    <div class="bg-gradient-to-r from-background/50 to-muted/10 rounded-xl border border-muted/30 p-6">
      <!-- Loading State -->
      <CommonLoadingState v-if="!isMounted || loading" type="form" context="inline" size="md" />

      <!-- Empty State -->
      <CommonEmptyState
        v-else-if="isMounted && !loading && data.length === 0"
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
      <FormRelationList
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
    </div>

    <!-- Pagination Section -->
    <div class="bg-gradient-to-r from-muted/10 to-background/50 rounded-xl border border-muted/30 p-4">
      <FormRelationPagination
        :page="page"
        :total="total"
        :limit="limit"
        :loading="loading"
        :disabled="props.disabled"
        @update:page="page = $event"
        @apply="apply"
      />
    </div>
  </div>

  <FormRelationCreateDrawer
    v-model="showCreateDrawer"
    :relation-meta="props.relationMeta"
    @created="() => fetchData()"
    v-model:selected="selected"
  />

  <FormRelationDetailDrawer
    v-model="detailModal"
    :record="detailRecord"
    :table-name="targetTable?.name"
  />

  <!-- Filter Drawer -->
  <FilterDrawerLazy
    v-model="showFilterDrawer"
    :filter-value="currentFilter"
    :table-name="targetTable?.name || ''"
    @apply="applyFilter"
    @clear="clearFilter"
  />
</template>
