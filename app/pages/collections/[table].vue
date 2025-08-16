<script setup lang="ts">

const route = useRoute();
const { tables, fetchSchema, globalLoading } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();
const { registerTableMenusWithSidebarIds } = useMenuRegistry();
const tableName = "table_definition";
const { getIncludeFields } = useSchema(tableName);

const { isMounted } = useMounted();

const table = ref<any>();

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

const { pending: saving, execute: executePatchTable } = useApiLazy(
  () => `/table_definition/${table.value?.id || "undefined"}`,
  {
    method: "patch",
    body: computed(() => table.value),
    errorContext: "Update Table",
  }
);

const { pending: deleting, execute: executeDeleteTable } = useApiLazy(
  () => `/table_definition/${table.value?.id || "undefined"}`,
  {
    method: "delete",
    errorContext: "Delete Table",
  }
);

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
  globalLoading.value = true;
  try {
    await executePatchTable();
    globalLoading.value = false;  // Turn off before fetchSchema sets it again
    await fetchSchema();

    registerTableMenusWithSidebarIds(tables.value);

    toast.add({
      title: "Success",
      color: "success",
      description: "Table structure updated!",
    });
  } catch (error) {
    globalLoading.value = false;
    throw error;
  }
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
  globalLoading.value = true;
  try {
    await executeDeleteTable();
    globalLoading.value = false;  // Turn off before fetchSchema sets it again
    await fetchSchema();

    registerTableMenusWithSidebarIds(tables.value);

    toast.add({
      title: "Success",
      color: "success",
      description: "Table deleted!",
    });
    return navigateTo(`/collections`);
  } catch (error) {
    globalLoading.value = false;
    throw error;
  }
}

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <div class="relative">
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        type="form"
        context="page"
        title="Loading table structure..."
        description="Fetching table definition and schema"
        size="sm"
      />

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
