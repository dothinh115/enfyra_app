<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";

const route = useRoute();
const tableName = route.params.table as string;
const { tables, schemas } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const data = ref([]);
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { confirm } = useConfirm();
const toast = useToast();
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createButtonLoader } = useButtonLoading();
const { checkPermissionCondition } = usePermissions();

// Register header actions
useHeaderActionRegistry({
  id: "create-data-entry",
  label: "Create Entry",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  to: `/data/${route.params.table}/create`,
  class: "rounded-full",
  permission: {
    and: [
      {
        route: `/${route.params.table}`,
        actions: ["create"],
      },
    ],
  },
});

// Filter state
const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

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
  errorContext: `Loading ${tableName} data`,
});

// Delete single record composable
const deleteId = ref<string>("");
const { execute: executeSingleDelete } = useApiLazy(
  () => `/${tableName}/${deleteId.value}`,
  {
    method: "delete",
    errorContext: "Delete Record",
  }
);

// Build columns from schema
const columns = computed<ColumnDef<any>[]>(() => {
  const schema = schemas.value[tableName];
  if (!schema?.definition) return [];

  const cols: ColumnDef<any>[] = schema.definition
    .filter((field: any) => field.fieldType === "column")
    .map((field: any) => ({
      id: field.name,
      accessorKey: field.name,
      header: field.label || field.name,
      cell: ({ getValue }: any) => {
        const value = getValue();
        if (value === null || value === undefined) return "-";

        // Handle different field types
        if (field.type === "boolean") {
          return h(
            "span",
            {
              class: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                value
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`,
            },
            value ? "Yes" : "No"
          );
        }

        if (field.type === "datetime") {
          return new Date(value).toLocaleString();
        }

        if (field.type === "date") {
          return new Date(value).toLocaleDateString();
        }

        // Truncate long text
        const str = String(value);
        return str.length > 50 ? str.slice(0, 50) + "..." : str;
      },
    }));

  // Add actions column
  cols.push({
    id: "__actions",
    header: "Actions",
    enableHiding: false,
    size: 80,
    cell: ({ row }) => {
      const { checkPermissionCondition } = usePermissions();
      const hasDeletePermission = checkPermissionCondition({
        and: [
          {
            route: `/${route.params.table}`,
            actions: ["delete"],
          },
        ],
      });

      return h("div", { class: "flex justify-center" }, [
        h(
          "button",
          {
            class: hasDeletePermission
              ? "inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              : "inline-flex items-center px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded cursor-not-allowed opacity-50",
            onClick: hasDeletePermission
              ? (e) => {
                  e.stopPropagation();
                  handleDelete(row.original.id);
                }
              : undefined,
            disabled: !hasDeletePermission,
            title: hasDeletePermission ? "Delete" : "No permission to delete",
          },
          [
            h(
              "svg",
              { class: "w-3 h-3", fill: "currentColor", viewBox: "0 0 20 20" },
              [
                h("path", {
                  fillRule: "evenodd",
                  d: "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z",
                  clipRule: "evenodd",
                }),
              ]
            ),
          ]
        ),
      ]);
    },
  });

  return cols;
});

// Watch for API data changes
watch(
  apiData,
  (newData) => {
    if (newData?.data) {
      data.value = newData.data;
      total.value = newData.meta?.total_count || 0;
    }
  },
  { immediate: true }
);

// Apply filters - called by FilterDrawer
async function applyFilters() {
  page.value = 1;
  await fetchData();
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
  applyFilters();
}

async function handleDelete(id: string) {
  const result = await confirm({
    title: "Delete Record",
    content: "Are you sure you want to delete this record?",
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (!result) return;

  const deleteLoader = createButtonLoader(`delete-${id}`);

  await deleteLoader.withLoading(async () => {
    // Set the id and execute pre-defined composable
    deleteId.value = id;
    await executeSingleDelete();

    toast.add({
      title: "Success",
      description: "Record deleted successfully",
      color: "success",
    });
    await fetchData();
  });
}

async function handleBulkDelete(selectedRows: any[]) {
  const result = await confirm({
    title: "Delete Records",
    content: `Are you sure you want to delete ${selectedRows.length} record(s)?`,
    confirmText: "Delete All",
    cancelText: "Cancel",
  });

  if (!result) return;

  const deleteLoader = createButtonLoader("bulk-delete");

  await deleteLoader.withLoading(async () => {
    let successCount = 0;
    let failCount = 0;

    for (const row of selectedRows) {
      try {
        deleteId.value = row.id;
        await executeSingleDelete();
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.add({
        title: "Success",
        description: `${successCount} record(s) deleted successfully`,
        color: "success",
      });
    } else {
      toast.add({
        title: "Partial Success",
        description: `${successCount} deleted, ${failCount} failed`,
        color: "warning",
      });
    }

    await fetchData();
  });
}

onMounted(async () => {
  await fetchData();
});

// Remove auto-watch - FilterDrawer handles apply/clear events
</script>

<template>
  <div class="space-y-4">
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between">
          <div
            class="text-xl font-semibold capitalize flex items-center space-x-2"
          >
            <span>{{ table?.name || "Records" }}</span>
            <UButton
              icon="i-lucide-refresh-ccw"
              @click="fetchData()"
              :loading="loading"
            />
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-filter"
              :variant="hasActiveFilters(currentFilter) ? 'solid' : 'outline'"
              :color="hasActiveFilters(currentFilter) ? 'primary' : 'neutral'"
              @click="showFilterDrawer = true"
              size="sm"
            >
              <template v-if="hasActiveFilters(currentFilter)">
                Filters ({{ currentFilter.conditions.length }})
              </template>
              <template v-else> Filter </template>
            </UButton>
          </div>
        </div>
      </template>

      <!-- Data Table -->

      <DataTable
        :data="data"
        :columns="columns"
        :loading="loading"
        :page-size="pageLimit"
        :selectable="true"
        :on-bulk-delete="
          checkPermissionCondition({
            and: [
              {
                route: `/${route.params.table}`,
                actions: ['delete'],
              },
            ],
          })
            ? handleBulkDelete
            : undefined
        "
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
      </DataTable>

      <!-- Pagination - only show when more than 1 page -->
      <UPagination
        v-if="!loading && Math.ceil(total / pageLimit) > 1"
        v-model="page"
        :page-count="pageLimit"
        :total="total"
        @update:model-value="fetchData"
      />
    </UCard>

    <!-- Filter Drawer - use existing component -->
    <FilterDrawer
      v-model="showFilterDrawer"
      v-model:filter-value="currentFilter"
      :table-name="tableName"
      @apply="applyFilters"
      @clear="clearFilters"
    />
  </div>
</template>
