<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import ColumnSelector from "~/components/data-table/ColumnSelector.vue";

const route = useRoute();
const router = useRouter();
const tableName = route.params.table as string;
const { tables, schemas } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const data = ref([]);
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { checkPermissionCondition } = usePermissions();

// Mounted state để đánh dấu first render
const { isMounted } = useMounted();

// Filter state (move up before use)
const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

const filterLabel = computed(() => {
  const activeCount = currentFilter.value.conditions.length;
  return activeCount > 0 ? `Filters (${activeCount})` : "Filter";
});

const filterVariant = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "solid" : "outline";
});

const filterColor = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "secondary" : "neutral";
});

// API composables - all at setup level
const {
  data: apiData,
  pending: loading,
  execute: fetchData,
} = useApiLazy(() => `/${tableName}`, {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      limit: pageLimit,
      page: page.value,
      fields: "*",
      meta: "*",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
  errorContext: "Fetch Data",
});

// Use composables for column visibility and table actions
const {
  hiddenColumns,
  visibleColumns,
  toggleColumnVisibility,
  columnDropdownItems,
} = useDataTableVisibility(tableName, schemas);

const {
  selectedRows,
  isSelectionMode,
  handleDelete,
  handleBulkDelete,
  handleSelectionChange,
} = useDataTableActions(tableName, fetchData, data);

useSubHeaderActionRegistry([
  // Selection mode toggle button - only show when user has delete permission
  {
    id: "toggle-selection",
    label: computed(() =>
      isSelectionMode.value ? "Cancel Selection" : "Select Items"
    ),
    icon: computed(() =>
      isSelectionMode.value ? "lucide:x" : "lucide:check-square"
    ),
    variant: computed(() => (isSelectionMode.value ? "ghost" : "outline")),
    color: computed(() => (isSelectionMode.value ? "secondary" : "primary")),
    onClick: () => {
      const wasSelectionMode = isSelectionMode.value;
      isSelectionMode.value = !wasSelectionMode;

      // Clear selection when exiting selection mode
      if (wasSelectionMode) {
        selectedRows.value = [];
      }
    },
    side: "right",
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["delete"],
        },
      ],
    },
  },
  // Bulk delete button (only visible in selection mode with items selected)
  {
    id: "bulk-delete-selected",
    label: computed(() => `Delete Selected (${selectedRows.value.length})`),
    icon: "lucide:trash-2",
    variant: "solid",
    color: "error",
    side: "right",
    onClick: () => handleBulkDelete(selectedRows.value),
    show: computed(
      () => isSelectionMode.value && selectedRows.value.length > 0
    ),
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["delete"],
        },
      ],
    },
  },
  // Column picker (default side)
  {
    id: "column-picker-component",
    component: ColumnSelector,
    get key() {
      return `column-picker-${Array.from(hiddenColumns.value).join("-")}`;
    },
    get props() {
      return {
        items: columnDropdownItems.value,
        variant: "soft",
      };
    },
    side: "right",
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["read"],
        },
      ],
    },
  },
]);

// Use DataTable composable system
const { buildColumn, buildActionsColumn } = useDataTableColumns();

// Build columns from schema using composable
const columns = computed<ColumnDef<any>[]>(() => {
  const schema = schemas.value[tableName];
  if (!schema?.definition) return [];

  const dataColumns = schema.definition
    .filter(
      (field: any) =>
        field.fieldType === "column" && visibleColumns.value.has(field.name)
    )
    .map((field: any) => {
      let config: DataTableColumnConfig = {
        id: field.name,
        header: field.label || field.name,
      };

      // Use built-in formatters when possible
      if (field.type === "datetime") {
        config.format = "datetime";
      } else if (field.type === "date") {
        config.format = "date";
      } else if (field.type === "boolean") {
        config.format = "badge";
        config.formatOptions = {
          badgeColor: (value: boolean) => (value ? "success" : "neutral"),
          badgeVariant: "soft",
          badgeMap: { true: "Yes", false: "No" },
        };
      } else {
        // Custom formatter for text truncation
        config.format = "custom";
        config.formatOptions = {
          formatter: (value: any) => {
            if (value === null || value === undefined) return "-";
            const str = String(value);
            return str.length > 50 ? str.slice(0, 50) + "..." : str;
          },
        };
      }

      return buildColumn(config);
    });

  // Add actions column using composable
  const actionsConfig = {
    actions: [
      {
        label: "Delete",
        icon: "i-lucide-trash-2",
        class: "text-red-500",
        show: () => {
          const hasDeletePermission = checkPermissionCondition({
            and: [
              {
                route: `/${route.params.table}`,
                actions: ["delete"],
              },
            ],
          });
          return hasDeletePermission;
        },
        onSelect: (row: any) => {
          handleDelete(row.id);
        },
      },
    ],
    width: 80,
  };

  const actionsColumn = buildActionsColumn(actionsConfig);

  return [...dataColumns, actionsColumn];
});

// Watch for API data changes
watch(
  apiData,
  (newData) => {
    if (newData?.data) {
      data.value = newData.data;
      const hasFilters = hasActiveFilters(currentFilter.value);
      total.value = hasFilters
        ? newData.meta?.filterCount || newData.meta?.totalCount || 0
        : newData.meta?.totalCount || 0;
    }
  },
  { immediate: true }
);

// Handle filter apply from FilterDrawer
async function handleFilterApply(filter: FilterGroup) {
  currentFilter.value = filter;

  if (page.value === 1) {
    // Already on page 1 → fetch directly
    await fetchData();
  } else {
    // On other page → go to page 1, watch will trigger
    const newQuery = { ...route.query };
    delete newQuery.page;

    await router.replace({
      query: newQuery,
    });
  }
}

// Clear filters function
async function clearFilters() {
  await handleFilterApply(createEmptyFilter());
}

// Delete handlers are now in useDataTableActions composable

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchData();
  },
  { immediate: true }
);

// Register header actions with component test (after all variables are defined)
useHeaderActionRegistry([
  {
    id: "filter-data-entries",
    get label() {
      return filterLabel.value;
    },
    icon: "lucide:filter",
    get variant() {
      return filterVariant.value;
    },
    get color() {
      return filterColor.value;
    },
    get key() {
      return `filter-${
        currentFilter.value.conditions.length
      }-${hasActiveFilters(currentFilter.value)}`;
    },
    size: "md",
    onClick: () => {
      showFilterDrawer.value = true;
    },
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["read"],
        },
      ],
    },
  },
  {
    id: "create-data-entry",
    label: "Create",
    icon: "lucide:plus",
    variant: "solid",
    color: "primary",
    size: "md",
    to: `/data/${route.params.table}/create`,
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["create"],
        },
      ],
    },
  },
]);

// Remove auto-watch - FilterDrawer handles apply/clear events
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <CommonPageHeader
      :title="table?.name || 'Data Records'"
      title-size="md"
      show-background
      background-gradient="from-cyan-500/8 via-blue-400/5 to-transparent"
      padding-y="py-6"
    />

    <!-- Data Table -->
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State: khi chưa mounted (first render) hoặc đang loading -->
      <div v-if="!isMounted || loading" class="w-full py-8">
        <CommonLoadingState
          type="table"
          size="md"
          context="page"
          :title="`Loading data...`"
          description="Fetching records"
        />
      </div>

      <!-- Data Table: khi có data -->
      <DataTableLazy
        v-else-if="data && data.length > 0"
        :data="data"
        :columns="columns"
        :loading="false"
        :page-size="pageLimit"
        :selectable="isSelectionMode"
        @selection-change="handleSelectionChange"
        @row-click="(row: any) => navigateTo(`/data/${tableName}/${row.id}`)"
      >
        <template #header-actions>
          <div
            v-if="hasActiveFilters(currentFilter)"
            class="flex items-center gap-2"
          >
            <UBadge color="primary" variant="soft">
              {{ currentFilter.conditions.length }} active filters
            </UBadge>
            <UButton
              icon="i-lucide-x"
              size="xs"
              variant="ghost"
              @click="clearFilters"
            >
              Clear
            </UButton>
          </div>
        </template>
      </DataTableLazy>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <div v-else class="w-full py-8">
        <CommonEmptyState
          title="No data available"
          description="There are no records to display"
          icon="lucide:database"
          size="lg"
        />
      </div>
    </Transition>

    <!-- Pagination - only show when more than 1 page -->
    <UPagination
      v-if="!loading && Math.ceil(total / pageLimit) > 1"
      v-model:page="page"
      :items-per-page="pageLimit"
      :total="total"
      show-edges
      :sibling-count="1"
      :to="
        (p) => ({
          path: route.path,
          query: { ...route.query, page: p },
        })
      "
      color="secondary"
      active-color="secondary"
    />

    <!-- Filter Drawer - use existing component -->
    <FilterDrawerLazy
      :model-value="showFilterDrawer"
      @update:model-value="showFilterDrawer = $event"
      :table-name="tableName"
      :current-filter="currentFilter"
      @apply="handleFilterApply"
    />
  </div>
</template>
