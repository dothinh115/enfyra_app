<script setup lang="ts">
import type { ColumnConfig } from "~/components/DataTable.vue";

const route = useRoute();
const tableName = route.params.table as string;
const { tables, schemas } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const fieldSelectArr = ref<string[]>([]);
const data = ref();
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { confirm } = useConfirm();
const toast = useToast();
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();

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
  const filterQuery = hasActiveFilters(currentFilter.value)
    ? buildQuery(currentFilter.value)
    : {};

  const { data: item } = await useApi(`/${tableName}`, {
    query: {
      limit: pageLimit,
      page: page.value,
      fields: "*",
      meta: "*",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    },
  });
  total.value = item.value?.meta.totalCount;
  data.value = item.value;
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
    const { data, error } = await useApiLazy(`/${route.params.table}/${id}`, {
      method: "delete",
    });
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
            <UButton icon="i-lucide-refresh-ccw" @click="fetchData()" />
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

      <DataTable
        :data="data?.data || []"
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-database', label: 'Không có dữ liệu' }"
      />
      <template #footer>
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
