<script setup lang="ts">
import { useRoute } from "vue-router";
import { useGlobalState } from "~/composables/useGlobalState";
import { useConfirm } from "~/composables/useConfirm";
import { useToast } from "#imports";

const route = useRoute();
const { tables, globalForm, globalFormLoading, fetchSchema } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();

const tableName = ref(route.params.table as string);
const table = ref<any>();

const { data } = await useApiLazy("/table_definition", {
  query: {
    fields: "*,columns.*,relations.*",
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

watch(
  () => table.value.columns.map((col: any) => col.type),
  (newTypes, oldTypes) => {
    const notIndexable = ["text", "varchar", "simple-json"];
    newTypes.forEach((type: any, i: number) => {
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

function validateColumn(col: any) {
  col.error = {};
  if (!col.isNullable && !col.name?.trim())
    col.error.name = "Tên cột là bắt buộc";
  else if (!tableNameOrFieldRegexCheck.test(col.name?.trim()))
    col.error.name =
      "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
  else col.error.name = "";
  if (!col.type?.trim()) col.error.type = "Phải chọn kiểu dữ liệu";
}

function validateRelation(rel: any) {
  rel.error = {};
  if (!rel.propertyName?.trim())
    rel.error.propertyName = "Tên quan hệ là bắt buộc";
  else if (!tableNameOrFieldRegexCheck.test(rel.propertyName?.trim()))
    rel.error.name =
      "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
  else rel.error.name = "";
  if (!rel.type?.trim()) rel.error.type = "Phải chọn loại quan hệ";
  if (rel.targetTable === null || rel.targetTable === undefined)
    rel.error.targetTable = "Phải chọn bảng đích";
  else rel.error.targetTable = "";
}

function validateAll() {
  let isValid = true;
  for (const col of table.value.columns as any) {
    validateColumn(col);
    if (col.error?.name || col.error?.type) isValid = false;
  }
  for (const rel of table.value.relations as any) {
    validateRelation(rel);
    if (rel.error?.propertyName || rel.error?.type || rel.error?.targetTable)
      isValid = false;
  }
  return isValid;
}

async function save() {
  globalFormLoading.value = true;

  if (!validateAll()) {
    toast.add({
      title: "Dữ liệu không hợp lệ",
      color: "error",
      description: "Vui lòng kiểm tra lại các trường có lỗi.",
    });
    globalFormLoading.value = false;
    return;
  }
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
  const toastId = toast.add({
    title: "Đang xử lý...",
    color: "info",
    description: "Đang reload schema...",
  });

  const { data, error } = await useApiLazy(
    `/table_definition/${table.value.id}`,
    {
      method: "patch",
      body: table.value,
    }
  );

  toast.remove(toastId.id);
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

  globalFormLoading.value = false;
}

async function handleDelete() {
  globalFormLoading.value = true;

  const ok = await confirm({
    content: `Bạn chắc chắn muốn xoá bảng ${table.value.name}?`,
  });
  if (!ok) {
    globalFormLoading.value = false;
    return;
  }
  await deleteTable();
  globalFormLoading.value = false;
}

async function deleteTable() {
  const toastId = toast.add({
    title: "Đang xử lý...",
    color: "info",
    description: "Đang reload schema...",
  });
  const { data, error } = await useApiLazy(
    `/table_definition/${table.value.id}`,
    {
      method: "delete",
    }
  );
  toast.remove(toastId.id);

  if (data.value) {
    toast.add({
      title: "Thành công",
      color: "success",
      description: "Schema đã được reload!",
    });
    await fetchSchema();
    return navigateTo(`/collections`);
  } else if (error.value) {
    toast.add({
      title: "Lỗi",
      color: "error",
      description: error.value?.message,
    });
  }
}
</script>

<template>
  <UForm @submit.prevent="save" :state="table" ref="globalForm">
    <div class="mx-auto">
      <TableForm v-model="table" @save="save">
        <div class="space-y-6">
          <TableConstraints
            v-model="table"
            :column-names="table.columns?.map((c:any) => c.name)"
          />
          <TableColumns v-model="table.columns" />
          <TableRelations
            v-model="table.relations"
            :table-options="
              tables?.map((t) => ({ label: t.name, value: { id: t.id } }))
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
              :loading="globalFormLoading"
              >Xoá bảng</UButton
            >
          </div>
        </div>
      </TableForm>
    </div>
  </UForm>
</template>
