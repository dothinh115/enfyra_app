<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

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

const columns = computed(() => {
  return generateAdvancedColumns(
    table.value.columns.filter((col: any) =>
      fieldSelectArr.value.includes(col.name)
    )
  );
});

function generateAdvancedColumns(
  columnsMeta: any[] = []
): TableColumn<any, any>[] {
  const result = columnsMeta.map((col): TableColumn<any, any> => {
    const { name, type } = col;

    return {
      accessorKey: name,
      header: name,

      cell: ({ row }) => {
        const value: any = row.getValue(name);

        switch (type) {
          case "boolean":
            return h("div", { class: "text-sm" }, value ? "true" : "false");

          case "datetime":
            return new Date(value).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

          default:
            return value;
        }
      },
    };
  });

  result.push({
    id: "__actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    size: 40,
    cell: ({ row }) =>
      h("div", { class: "flex justify-end" }, [
        h(
          resolveComponent("UDropdownMenu"),
          {
            items: [
              [
                {
                  label: "Edit",
                  icon: "lucide:pencil",
                  onClick: () => navigateTo(`${route.path}/${row.original.id}`),
                },

                {
                  label: "Delete",
                  icon: "lucide:trash-2",
                  color: "error",
                  onClick: async () => await handleDelete(row.original.id),
                },
              ],
            ],
            popper: {
              placement: "bottom-end",
            },
          },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "lucide:more-vertical",
                size: "xl",
                variant: "outline",
                color: "gray",
                class: "cursor-pointer",
              }),
          }
        ),
      ]),
  });

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
          <div>
            <UDropdownMenu
              :items="
                table.columns.map((col: any) => col.name).map((field:any) => ({
                  label: field,
                  type: 'checkbox',
                  checked: fieldSelectArr.includes(field),
                  onSelect: (e:Event) => {
                    if(fieldSelectArr.includes(field)) {
                      fieldSelectArr = fieldSelectArr.filter((item) => item !== field);
                    } else fieldSelectArr.push(field)
                    e.preventDefault()
                  }
                }))
              "
            >
              <template #default>
                <UButton icon="i-lucide-list" color="primary" size="md"
                  >Chọn field</UButton
                >
              </template>
            </UDropdownMenu>
          </div>
        </div>
      </template>
      <UTable
        :data="data?.data || []"
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-database', label: 'Không có dữ liệu' }"
      />
    </UCard>
    <div class="flex justify-center mt-6">
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
        v-if="page > 1"
      />
    </div>
  </div>
</template>
