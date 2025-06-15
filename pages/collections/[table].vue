<script setup lang="ts">
import { reactive, watch, ref, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useGlobalState } from "~/composables/useGlobalState";
import { useConfirm } from "~/composables/useConfirm";
import { useToast } from "#imports";

const route = useRoute();
const { tables, fetchRoute, tableForm } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();

const tableName = ref(route.params.table as string);
const table = reactive<any>({});
console.log(table);
const isLoading = ref(false);

function assignToTable(source: any) {
  Object.assign(table, JSON.parse(JSON.stringify(source)));

  table.uniques ||= [];
  table.indexes ||= [];
  table.columns ||= [];
  table.relations ||= [];

  for (const col of table.columns as any[]) {
    col._editing = false;
    col.error = {};
  }
  for (const rel of table.relations as any[]) {
    rel._editing = false;
    rel.error = {};
  }
}

watch(
  () => route.params.table,
  async (newTableName) => {
    tableName.value = newTableName as string;
    const found = tables.value.find((t) => t.name === tableName.value);
    if (found) {
      assignToTable(found);
      await nextTick();
    }
  },
  { immediate: true }
);

watch(
  () => table.columns.map((col: any) => col.type),
  (newTypes, oldTypes) => {
    const notIndexable = ["text", "varchar", "simple-json"];
    newTypes.forEach((type: any, i: number) => {
      if (type !== oldTypes[i]) {
        // 👉 Cột thứ i vừa đổi type
        if (notIndexable.includes(type)) {
          table.columns[i].isIndex = false;
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
  for (const col of table.columns as any) {
    validateColumn(col);
    if (col.error?.name || col.error?.type) isValid = false;
  }
  for (const rel of table.relations as any) {
    validateRelation(rel);
    if (rel.error?.propertyName || rel.error?.type || rel.error?.targetTable)
      isValid = false;
  }
  return isValid;
}

async function save() {
  if (!validateAll()) {
    toast.add({
      title: "Dữ liệu không hợp lệ",
      color: "error",
      description: "Vui lòng kiểm tra lại các trường có lỗi.",
    });
    return;
  }
  const ok = await confirm({
    content: "Bạn chắc chắn muốn sửa cấu trúc bảng?",
  });
  if (!ok) return;
  return patchTable();
}

function getCleanTablePayload() {
  const clone = JSON.parse(JSON.stringify(table));

  for (const col of clone.columns) {
    delete col._editing;
    delete col.error;
  }
  for (const rel of clone.relations) {
    delete rel._editing;
    delete rel.error;
  }

  if (!clone.uniques?.length) delete clone.uniques;
  if (!clone.indexes?.length) delete clone.indexes;

  return clone;
}

async function patchTable() {
  isLoading.value = true;
  const toastId = toast.add({
    title: "Đang xử lý...",
    color: "info",
    description: "Đang cập nhật cấu trúc bảng...",
  });

  const payload = getCleanTablePayload();

  const { data, error } = await useApi(`/table_definition/${table.id}`, {
    method: "patch",
    body: payload,
  });

  toast.remove(toastId.id);
  isLoading.value = false;

  if (data.value) {
    await fetchRoute();
    const updated = tables.value.find((t) => t.id === table.id);
    if (updated) {
      assignToTable(updated);
      await nextTick();
    }
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
}
</script>

<template>
  <UForm @submit.prevent="save" :state="table" ref="tableForm">
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
              tables?.map((t) => ({ label: t.name, value: t.id }))
            "
          />
        </div>
      </TableForm>
    </div>
  </UForm>
</template>
