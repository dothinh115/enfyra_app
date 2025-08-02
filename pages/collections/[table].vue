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
        // 👉 Cột thứ i vừa đổi type
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
    content: "Bạn chắc chắn muốn sửa cấu trúc bảng?",
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
      title: "Thành công",
      color: "success",
      description: "Cấu trúc bảng đã được cập nhật!",
    });
  } else if (error.value) {
    toast.add({
      title: "Lỗi",
      color: "error",
      description: error.value?.message,
    });
  }

  globalLoading.value = false;
  globalFormLoading.value = false;
}

async function handleDelete() {
  const deleteLoader = createButtonLoader('delete-table');
  
  const ok = await confirm({
    content: `Bạn chắc chắn muốn xoá bảng ${table.value.name}?`,
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
      title: "Thành công",
      color: "success",
      description: "Bảng đã được xóa!",
    });
    globalLoading.value = false;
    return navigateTo(`/collections`);
  } else if (error.value) {
    toast.add({
      title: "Lỗi",
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
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="relative">
        <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
        <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-muted-foreground">Loading table structure...</p>
    </div>

    <!-- Form content -->
    <UForm @submit.prevent="save" :state="table" ref="globalForm" v-else-if="table">
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
                >Xoá bảng</UButton
              >
            </div>
          </div>
        </TableForm>
      </div>
    </UForm>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20 gap-4">
      <UIcon name="i-lucide-database-x" class="w-12 h-12 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Table not found</p>
    </div>
  </div>
</template>
