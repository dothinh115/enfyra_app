<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";

const route = useRoute();
const tableName = route.params.table as string;
const { tables } = useGlobalState();
const total = ref(1);
const page = ref(1);
const pageLimit = 10;

const table = computed(() => tables.value.find((t) => t.name === tableName));

const { data, pending, refresh } = await useApi(`/${tableName}`, {
  query: { limit: pageLimit, page: page.value, fields: "*", meta: "*" },
});
total.value = data.value?.meta.totalCount;

const columns = computed(() =>
  table ? generateAdvancedColumns(table.value.columns) : []
);

function generateAdvancedColumns(columnsMeta: any[]): TableColumn<any, any>[] {
  return columnsMeta.map((col): TableColumn<any, any> => {
    const { name, type } = col;

    return {
      accessorKey: name,
      header: name,

      cell: ({ row }) => {
        const value: any = row.getValue(name);

        switch (type) {
          case "boolean":
            return h("div", { class: "text-sm" }, value ? "✅ Đúng" : "❌ Sai");

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
}

watch(
  () => route.query.page,
  async (newVal) => {
    if (!newVal) page.value = 1;
    else page.value = Number(newVal);
    await refresh();
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="text-xl font-semibold capitalize">
        {{ table?.name || "Records" }}
      </div>
      <UButton
        icon="i-lucide-refresh-ccw"
        @click="refresh()"
        :loading="pending"
      />
    </div>

    <UCard>
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
      />
    </div>
  </div>
</template>
