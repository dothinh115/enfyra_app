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

const {
  pending: deleting,
  execute: executeDeleteTable,
  error: deleteError,
} = useApiLazy(() => `/table_definition/${table.value?.id || "undefined"}`, {
  method: "delete",
  errorContext: "Delete Table",
});

useHeaderActionRegistry([
  {
    id: "save-table",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
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

// Initialize form data
async function initializeForm() {
  await fetchTableData();
  const data = tableData.value?.data?.[0];
  if (data) {
    table.value = data;
  }
}

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
    globalLoading.value = false; // Turn off before fetchSchema sets it again
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
  await executeDeleteTable();

  if (deleteError.value) {
    globalLoading.value = false;
    return; // Error already handled by useApiLazy
  }

  globalLoading.value = false; // Turn off before fetchSchema sets it again
  await fetchSchema();

  registerTableMenusWithSidebarIds(tables.value);

  toast.add({
    title: "Success",
    color: "success",
    description: "Table deleted!",
  });
  return navigateTo(`/collections`);
}

onMounted(() => {
  initializeForm();
});
</script>

<template>
  <div class="relative">
    <!-- Header -->
    <CommonPageHeader
      :title="table ? `Edit Table: ${table.name}` : 'Table Editor'"
      title-size="lg"
      show-background
      background-gradient="from-indigo-500/8 via-purple-400/5 to-transparent"
      padding-y="py-6"
    />
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
        <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
          <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
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
                    tables?.map((t) => ({
                      label: t?.name,
                      value: { id: t.id },
                    }))
                  "
                />
              </div>
            </TableForm>
          </div>
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
