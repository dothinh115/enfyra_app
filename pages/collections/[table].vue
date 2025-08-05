<script setup lang="ts">
import { useRoute } from "vue-router";
import { useGlobalState } from "~/composables/useGlobalState";
import { useConfirm } from "~/composables/useConfirm";
import { useToast } from "#imports";

const route = useRoute();
const { tables, globalForm, globalFormLoading, fetchSchema } = useGlobalState();
const { createButtonLoader } = useButtonLoading();
const { confirm } = useConfirm();
const toast = useToast();
const tableName = "table_definition";
const { getIncludeFields } = useSchema(tableName);

const table = ref<any>();
const loading = ref(false);

async function fetchData() {
  loading.value = true;
  const { data } = await useApiLazy("/table_definition", {
    query: {
      fields: getIncludeFields(),
      filter: {
        name: {
          _eq: route.params.table,
        },
      },
    },
  });
  if (data.value.data) {
    table.value = data.value.data[0];
  }
  loading.value = false;
}

onMounted(fetchData);

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
  globalFormLoading.value = true;
  const ok = await confirm({
    content: "Are you sure you want to modify table structure?",
  });
  if (!ok) {
    globalFormLoading.value = false;
    return;
  }
  await patchTable();
}

async function patchTable() {
  const { globalLoading } = useGlobalState();
  globalLoading.value = true;

  const { data, error } = await useApiLazy(
    `/table_definition/${table.value.id}`,
    {
      method: "patch",
      body: table.value,
    }
  );

  if (data.value) {
    await fetchSchema();
    toast.add({
      title: "Success",
      color: "success",
      description: "Table structure updated!",
    });
  } else if (error.value) {
    toast.add({
      title: "Error",
      color: "error",
      description: error.value?.message,
    });
  }

  globalLoading.value = false;
  globalFormLoading.value = false;
}

async function handleDelete() {
  const deleteLoader = createButtonLoader("delete-table");

  const ok = await confirm({
    content: `Are you sure you want to delete table ${table.value.name}?`,
  });
  if (!ok) {
    return;
  }

  await deleteLoader.withLoading(async () => {
    await deleteTable();
  });
}

async function deleteTable() {
  const { globalLoading } = useGlobalState();
  globalLoading.value = true;

  const { data, error } = await useApiLazy(
    `/table_definition/${table.value.id}`,
    {
      method: "delete",
    }
  );

  if (data.value) {
    await fetchSchema();
    toast.add({
      title: "Success",
      color: "success",
      description: "Table deleted!",
    });
    globalLoading.value = false;
    return navigateTo(`/collections`);
  } else if (error.value) {
    toast.add({
      title: "Error",
      color: "error",
      description: error.value?.message,
    });
    globalLoading.value = false;
  }
}
</script>

<template>
  <div class="relative">
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading"
      title="Loading table structure..."
      description="Fetching table definition and schema"
      size="lg"
    />

    <!-- Form content -->
    <UForm
      @submit.prevent="save"
      :state="table"
      ref="globalForm"
      v-else-if="table"
    >
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
                size="lg"
                color="error"
                variant="solid"
                class="hover:cursor-pointer"
                @click="handleDelete"
                :disabled="table.isSystem"
                :loading="createButtonLoader('delete-table').isLoading.value"
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
      icon="lucide:database-x"
      size="lg"
    />
  </div>
</template>
