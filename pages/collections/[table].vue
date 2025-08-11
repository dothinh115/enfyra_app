<script setup lang="ts">
// All composables are auto-imported

const route = useRoute();
const { tables, fetchSchema, globalLoading } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();
const { registerTableMenusWithSidebarIds } = useMenuRegistry();
const tableName = "table_definition";
const { getIncludeFields } = useSchema(tableName);
import { isSystemTableModifiable } from "~/utils/constants";

// Mounted state để đánh dấu first render
const isMounted = ref(false);

const table = ref<any>();

// API composables at setup level
const {
  data: tableData,
  pending: loading,
  execute: fetchTableData,
} = useApiLazy(() => "/table_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    filter: {
      name: {
        _eq: route.params.table,
      },
    },
  })),
  errorContext: "Fetch Table Data",
});

// Composable for patch table
const { pending: saving, execute: executePatchTable } = useApiLazy(
  () => `/table_definition/${table.value?.id || "undefined"}`,
  {
    method: "patch",
    body: computed(() => table.value),
    errorContext: "Update Table",
  }
);

// Composable for delete table
const { pending: deleting, execute: executeDeleteTable } = useApiLazy(
  () => `/table_definition/${table.value?.id || "undefined"}`,
  {
    method: "delete",
    errorContext: "Delete Table",
  }
);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-table",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "lg",
    loading: computed(() => saving.value || globalLoading.value),
    disabled: computed(
      () => table.value?.isSystem && !isSystemTableModifiable(table.value?.name)
    ),
    submit: save,
    permission: {
      and: [
        {
          route: "/table_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-table",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "lg",
    loading: computed(() => deleting.value || globalLoading.value),
    disabled: computed(
      () => table.value?.isSystem && !isSystemTableModifiable(table.value?.name)
    ),
    onClick: handleDelete,
    permission: {
      and: [
        {
          route: "/table_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

async function fetchData() {
  await fetchTableData();
  if ((tableData.value as any)?.data) {
    const tableDataRaw = (tableData.value as any).data[0];
    table.value = tableDataRaw;
  }
}

// Watch for table data changes
watch(
  tableData,
  (newData) => {
    if (newData?.data) {
      const tableDataRaw = newData.data[0];
      table.value = tableDataRaw;
    }
  },
  { immediate: true }
);

async function save() {
  const ok = await confirm({
    content: "Are you sure you want to modify table structure?",
  });
  if (!ok) {
    return;
  }
  await patchTable();
}

async function patchTable() {
  await executePatchTable();
  await fetchSchema();

  // Re-register table menus to reflect any name changes
  registerTableMenusWithSidebarIds(tables.value);

  toast.add({
    title: "Success",
    color: "success",
    description: "Table structure updated!",
  });
}

async function handleDelete() {
  const ok = await confirm({
    content: `Are you sure you want to delete table ${table.value.name}?`,
  });
  if (!ok) {
    return;
  }

  await deleteTable();
}

async function deleteTable() {
  await executeDeleteTable();
  await fetchSchema();

  // Re-register table menus to remove deleted table
  registerTableMenusWithSidebarIds(tables.value);

  toast.add({
    title: "Success",
    color: "success",
    description: "Table deleted!",
  });
  return navigateTo(`/collections`);
}

onMounted(async () => {
  await fetchData();
  isMounted.value = true;
});
</script>

<template>
  <div class="relative">
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State: khi chưa mounted hoặc đang loading -->
      <CommonLoadingState
        v-if="!isMounted || loading"
        type="form"
        context="page"
        title="Loading table structure..."
        description="Fetching table definition and schema"
        size="sm"
      />

      <!-- Form Content: khi có data -->
      <UForm v-else-if="table" @submit.prevent="save" :state="table">
        <div class="mx-auto">
          <TableForm v-model="table" @save="save">
            <div class="space-y-6">
              <TableConstraints
                v-model="table"
                :column-names="table.columns?.map((c:any) => c?.name)"
              />
              <TableColumns v-model="table.columns" />
              <TableRelations
                v-model="table.relations"
                :table-options="
                  tables?.map((t) => ({ label: t?.name, value: { id: t.id } }))
                "
              />
            </div>
          </TableForm>
        </div>
      </UForm>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <CommonEmptyState
        v-else
        title="Table not found"
        description="The requested table could not be loaded"
        icon="lucide:database"
        size="sm"
      />
    </Transition>
  </div>
</template>
