<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import type { DataTableColumnConfig } from "~/composables/useDataTableColumns";
import ColumnSelector from "~/components/data-table/ColumnSelector.vue";

const route = useRoute();
const tableName = route.params.table as string;
const { tables, schemas } = useGlobalState();
const { isTablet } = useScreen();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const data = ref([]);
const selectedRows = ref<any[]>([]);
const isSelectionMode = ref(false);
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { confirm } = useConfirm();
const toast = useToast();
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createLoader } = useLoader();
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

// Delete single record composable
const deleteId = ref<string>("");
const { execute: executeDelete, error: deleteError } = useApiLazy(
  () => `/${tableName}`,
  {
    method: "delete",
    errorContext: "Delete Record",
  }
);

// Column visibility state with localStorage support - lưu hidden columns thay vì visible
const hiddenColumns = ref<Set<string>>(new Set());

// Computed để tính visible columns từ hidden columns
const visibleColumns = computed(() => {
  const schema = schemas.value[tableName];
  if (!schema?.definition) return new Set();

  const columnFields = schema.definition
    .filter((field: any) => field.fieldType === "column")
    .map((field: any) => field.name);

  // Visible = tất cả columns trừ đi hidden columns
  return new Set(
    columnFields.filter((field: string) => !hiddenColumns.value.has(field))
  );
});

// Load saved column visibility from localStorage
const loadColumnVisibility = (
  tableName: string,
  columnFields: string[]
): Set<string> => {
  try {
    const saved = localStorage.getItem(`columnVisibility_${tableName}`);
    if (saved) {
      const savedHiddenColumns = JSON.parse(saved);
      // Only include hidden columns that still exist in the schema
      const validHiddenColumns = savedHiddenColumns.filter((col: string) =>
        columnFields.includes(col)
      );
      return new Set(validHiddenColumns);
    }
  } catch (error) {
    console.warn("Failed to load column visibility from localStorage:", error);
  }
  // Default: no columns hidden (all visible)
  return new Set();
};

// Save column visibility to localStorage
const saveColumnVisibility = (tableName: string, hiddenCols: Set<string>) => {
  try {
    localStorage.setItem(
      `columnVisibility_${tableName}`,
      JSON.stringify(Array.from(hiddenCols))
    );
  } catch (error) {
    console.warn("Failed to save column visibility to localStorage:", error);
  }
};

// Initialize visible columns when schema changes
watch(
  () => schemas.value[tableName],
  (schema) => {
    if (schema?.definition) {
      const columnFields = schema.definition
        .filter((field: any) => field.fieldType === "column")
        .map((field: any) => field.name);

      // Load from localStorage or default to no hidden columns (all visible)
      hiddenColumns.value = loadColumnVisibility(tableName, columnFields);
    }
  },
  { immediate: true }
);

// Column visibility dropdown items
const columnDropdownItems = computed(() => {
  const schema = schemas.value[tableName];
  if (!schema?.definition) return [];

  const items = schema.definition
    .filter((field: any) => field.fieldType === "column")
    .map((field: any) => ({
      label: field.label || field.name,
      type: "checkbox" as const,
      get checked() {
        return !hiddenColumns.value.has(field.name); // checked = not hidden
      },
      onToggle: () => {
        toggleColumnVisibility(field.name);
      },
    }));

  return items;
});

// Toggle column visibility
function toggleColumnVisibility(columnName: string) {
  if (hiddenColumns.value.has(columnName)) {
    hiddenColumns.value.delete(columnName); // Show column
  } else {
    hiddenColumns.value.add(columnName); // Hide column
  }

  // Trigger reactivity
  hiddenColumns.value = new Set(hiddenColumns.value);

  // Save to localStorage
  saveColumnVisibility(tableName, hiddenColumns.value);
}

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
      isSelectionMode.value = !isSelectionMode.value;
      if (!isSelectionMode.value) {
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
    onClick: () => handleBulkDeleteIfAllowed(selectedRows.value),
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
      // Use filterCount when there are active filters, otherwise use totalCount
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
  page.value = 1;
  await fetchData();
}

// Clear filters function
async function clearFilters() {
  await handleFilterApply(createEmptyFilter());
}

async function handleDelete(id: string) {
  const result = await confirm({
    title: "Delete Record",
    content: "Are you sure you want to delete this record?",
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!result) return;

  const deleteLoader = createLoader();

  await deleteLoader.withLoading(async () => {
    // Set the id and execute pre-defined composable
    deleteId.value = id;
    await executeDelete({ id });

    // Check if there was an error
    if (deleteError.value) {
      return;
    }

    toast.add({
      title: "Success",
      description: "Record deleted successfully",
      color: "success",
    });
    await fetchData();
  });
}

async function handleBulkDeleteIfAllowed(selectedRows: any[]) {
  // Check permission first
  if (
    !checkPermissionCondition({
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["delete"],
        },
      ],
    })
  ) {
    return;
  }

  return handleBulkDelete(selectedRows);
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function handleBulkDelete(rows: any[]) {
  const result = await confirm({
    title: "Delete Records",
    content: `Are you sure you want to delete ${rows.length} record(s)?`,
    confirmText: "Delete All",
    cancelText: "Cancel",
  });

  if (!result) return;

  const deleteLoader = createLoader();

  await deleteLoader.withLoading(async () => {
    // Extract IDs from selected rows
    const ids = rows.map((row) => row.id);

    // Use batch delete with ids parameter
    await executeDelete({ ids });

    // Check if there was an error
    if (deleteError.value) {
      return;
    }

    toast.add({
      title: "Success",
      description: `${rows.length} record(s) deleted successfully`,
      color: "success",
    });

    // Clear selection after successful delete
    selectedRows.value = [];
    await fetchData();
  });
}

onMounted(async () => {
  await fetchData();
});

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
