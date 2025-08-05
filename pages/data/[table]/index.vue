<script setup lang="ts">
import type { ColumnConfig } from "~/components/DataTable.vue";
import { useApiLazyWithError } from "~/composables/useApiWithError";

const route = useRoute();
const tableName = route.params.table as string;
const { tables, schemas } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const fieldSelectArr = ref<string[]>([]);
const data = ref();
const loading = ref(false);
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { confirm } = useConfirm();
const toast = useToast();
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createButtonLoader } = useButtonLoading();

// Filter state
const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

// Initialize fieldSelectArr from schema
watch(
  schemas,
  (newSchemas) => {
    const schema = newSchemas[tableName];
    if (schema?.definition) {
      fieldSelectArr.value = schema.definition
        .filter((field: any) => field.fieldType === "column")
        .map((field: any) => field.name);
    }
  },
  { immediate: true }
);

async function fetchData() {
  loading.value = true;

  const filterQuery = hasActiveFilters(currentFilter.value)
    ? buildQuery(currentFilter.value)
    : {};

  const { data: item } = await useApiLazyWithError(`/${tableName}`, {
    query: {
      limit: pageLimit,
      page: page.value,
      fields: "*",
      meta: "*",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    },
    errorContext: "Fetch Data",
  });
  total.value = item.value?.meta.totalCount;
  data.value = item.value;
  loading.value = false;
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
  console.log("Opening filter drawer..."); // Debug
  showFilterDrawer.value = true;
  console.log("showFilterDrawer:", showFilterDrawer.value); // Debug
}

// filterSummary removed - now handled in FilterDrawer

const columns = computed<ColumnConfig[]>(() => {
  const schema = schemas.value[tableName];
  if (!schema?.definition) return [];

  const columnFields = schema.definition
    .filter(
      (field: any) =>
        field.fieldType === "column" &&
        fieldSelectArr.value.includes(field.name)
    )
    .sort((a: any, b: any) => a.id - b.id);

  return buildColumnConfigs(columnFields);
});

const actionCol: ColumnConfig = {
  accessorKey: "__actions",
  header: "",
  size: 40,
  tableName,
  cell: ({ row }) =>
    h("div", { class: "flex justify-end" }, [
      // @ts-ignore
      h(
        resolveComponent("UDropdownMenu"),
        {
          items: [
            [
              {
                label: "Edit",
                icon: "lucide:pencil",
                onClick: () => navigateTo(`${route.path}/${row.id}`),
              },
              {
                label: "Delete",
                icon: "lucide:trash-2",
                color: "error",
                loading: createButtonLoader(`delete-${row.id}`).isLoading.value,
                onClick: () => handleDelete(row.id),
              },
            ],
          ],
          popper: { placement: "bottom-end" },
        },
        {
          default: () =>
            h(resolveComponent("UButton"), {
              icon: "lucide:more-vertical",
              size: "xl",
              variant: "outline",
              color: "gray",
            }),
        }
      ),
    ]),
};

function buildColumnConfigs(colsMeta: any[]): ColumnConfig[] {
  const result: ColumnConfig[] = colsMeta.map((col) => {
    const { name, type } = col;

    let maxWidth: number | undefined;
    let maxChar: number | undefined;

    if (type === "boolean") maxWidth = 80;
    if (type === "datetime") maxWidth = 160;
    if (type === "text" || type === "richtext") maxChar = 40;
    if (name === "id") maxChar = 5;
    if (name === "__actions") maxChar = 2;

    return {
      accessorKey: name,
      header: name,
      maxWidth,
      maxChar,
      tableName,
    };
  });
  result.push(actionCol);
  return result;
}

async function handleDelete(id: number | string) {
  const ok = await confirm({
    content: "Are you sure??",
    title: "",
  });
  if (ok) {
    const deleteLoader = createButtonLoader(`delete-${id}`);
    await deleteLoader.withLoading(async () => {
      const { data, error } = await useApiLazyWithError(
        `/${route.params.table}/${id}`,
        {
          method: "delete",
          errorContext: "Delete Record",
        }
      );
      if (data.value.message === "Success") {
        await fetchData();
        toast.add({
          title: "Success",
          description: "Record deleted",
          color: "success",
        });
      }

      if (error.value) {
        toast.add({
          title: "Error",
          description: error.value?.message,
          color: "error",
        });
      }
    });
  }
}

watch(
  () => route.query.page,
  async (newVal) => {
    if (!newVal) page.value = 1;
    else page.value = Number(newVal);
    await fetchData();
  }
);

// Remove auto-apply watch - now using manual Apply button

onMounted(async () => {
  await fetchData();
});
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
              @click="openFilterDrawer"
              size="sm"
            >
              {{
                hasActiveFilters(currentFilter)
                  ? `Filtered (${currentFilter.conditions.length})`
                  : "Filter"
              }}
            </UButton>
          </div>
        </div>
      </template>

      <!-- Data Table -->

      <CommonLoadingState
        v-if="loading"
        title="Loading data..."
        description="Fetching records from the database"
        size="lg"
      />
      <DataTable
        v-else
        :data="data?.data || []"
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-database', label: 'No data available' }"
      />
      <template #footer v-if="!loading">
        <div class="flex justify-center">
          <UPagination
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
        </div>
      </template>
    </UCard>

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      v-model:filter-value="currentFilter"
      :schemas="schemas"
      :table-name="tableName"
      @apply="applyFilter"
      @clear="clearFilter"
    />
  </div>
</template>
