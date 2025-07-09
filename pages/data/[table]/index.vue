<script setup lang="ts">
import type { ColumnConfig } from "~/components/DataTable.vue";

const route = useRoute();
const tableName = route.params.table as string;
const { tables } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;
const fieldSelectArr = ref<string[]>([]);
const data = ref();
const table = computed(() => tables.value.find((t) => t.name === tableName));
const { confirm } = useConfirm();
const toast = useToast();
fieldSelectArr.value = table.value.columns.map((col: any) => col.name);

async function fetchData() {
  const { data: item } = await useApi(`/${tableName}`, {
    query: { limit: pageLimit, page: page.value, fields: "*", meta: "*" },
  });
  total.value = item.value?.meta.totalCount;
  data.value = item.value;
}

const columns = computed<ColumnConfig[]>(() => {
  return buildColumnConfigs(
    table.value.columns.filter((col: any) =>
      fieldSelectArr.value.includes(col.name)
    )
  );
});

const actionCol: ColumnConfig = {
  accessorKey: "__actions",
  header: "",
  size: 40,
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
        </div>
      </template>
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
  </div>
</template>
