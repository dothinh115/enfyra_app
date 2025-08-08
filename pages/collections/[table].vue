<script setup lang="ts">
// All composables are auto-imported

const route = useRoute();
const { tables, fetchSchema, globalLoading } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();
const tableName = "table_definition";
const { getIncludeFields } = useSchema(tableName);

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
useHeaderActionRegistry({
  id: "save-table",
  label: "Save Changes",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  size: "lg",
  loading: computed(() => saving.value || globalLoading.value),
  submit: save,
  permission: {
    and: [
      {
        route: "/table_definition",
        actions: ["update"],
      },
    ],
  },
});

async function fetchData() {
  await fetchTableData();
  if ((tableData.value as any)?.data) {
    const tableDataRaw = (tableData.value as any).data[0];
    table.value = {
      ...tableDataRaw,
      columns: [...(tableDataRaw.columns || [])],
      relations: [...(tableDataRaw.relations || [])],
    };
  }
}

onMounted(fetchData);

// Watch saving and deleting states to sync with globalLoading
watch([saving, deleting], ([newSaving, newDeleting]) => {
  globalLoading.value = newSaving || newDeleting;
});

watch(
  () => table.value?.columns.map((col: any) => col.type),
  (newTypes, oldTypes) => {
    if (!newTypes || !oldTypes) return;
    const notIndexable = ["text", "varchar", "simple-json"];
    newTypes?.forEach((type: any, i: number) => {
      if (type !== oldTypes[i]) {
        // 👉 Column i just changed type
        if (notIndexable.includes(type)) {
          table.value.columns[i].isIndex = false;
        }
      }
    });
  },
  { deep: true }
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
  toast.add({
    title: "Success",
    color: "success",
    description: "Table deleted!",
  });
  return navigateTo(`/collections`);
}
</script>

<template>
  <div class="relative">
    <!-- Loading state -->
    <CommonLoadingState
      type="form"
      context="page"
      v-if="loading"
      title="Loading table structure..."
      description="Fetching table definition and schema"
      size="sm"
    />

    <!-- Form content -->
    <UForm @submit.prevent="save" :state="table" v-else-if="table">
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
            <div>
              <UButton
                icon="lucide:delete"
                size="sm"
                color="error"
                variant="solid"
                class="hover:cursor-pointer"
                @click="handleDelete"
                :disabled="
                  table.isSystem || saving || deleting || globalLoading
                "
                :loading="deleting || globalLoading"
                >Delete Table</UButton
              >
            </div>
          </div>
        </TableForm>
      </div>
    </UForm>

    <!-- Empty state -->
    <CommonEmptyState
      v-else
      title="Table not found"
      description="The requested table could not be loaded"
      icon="lucide:database-off"
      size="sm"
    />
  </div>
</template>
