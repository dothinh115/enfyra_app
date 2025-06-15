<script setup lang="ts">
const router = useRouter();
const { fetchRoute, tables, tableForm, tableFormLoading } = useGlobalState();
const { confirm, onCancel } = useConfirm();
const toast = useToast();

const table = reactive<any>({
  name: "",
  description: "",
  columns: [],
  relations: [],
  uniques: [],
  indexes: [],
});

onMounted(() => {
  table.columns.push({
    name: "id",
    type: "int",
    isPrimary: true,
    isGenerated: true,
    isSystem: false,
    isNullable: false,
    isIndex: false,
    description: "ID tự tăng",
    _editing: false,
    error: {},
  });
});

const nameError = ref("");

watch(
  () => table.name,
  (newVal) => {
    const name = newVal.trim();
    if (name === "") nameError.value = "Không được để trống!";
    else if (!tableNameOrFieldRegexCheck.test(name))
      nameError.value =
        "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
    else if (name === "table")
      nameError.value = "Tên table không được là `table`";
    else nameError.value = "";
  }
);

watch(
  () => table.column.type,
  (newType) => {
    const notIndexableTypes = ["text", "longtext", "json", "blob"];
    if (notIndexableTypes.includes(newType)) {
      table.column.isIndex = false;
    }
  },
  { immediate: false }
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
  else rel.error.type = "";
  if (rel.targetTable === null || rel.targetTable === undefined)
    rel.error.targetTable = "Phải chọn bảng đích";
  else rel.error.targetTable = "";
}

function validateAll() {
  if (nameError.value || table.name.trim() === "") {
    toast.add({
      color: "error",
      description: nameError.value || "Tên bảng không được để trống",
    });
    return false;
  }
  let isValid = true;
  for (const col of table.columns as any[]) {
    validateColumn(col);
    if (col.error?.name || col.error?.type) isValid = false;
  }
  for (const rel of table.relations as any[]) {
    validateRelation(rel);
    if (rel.error?.propertyName || rel.error?.type || rel.error?.targetTable)
      isValid = false;
  }
  return isValid;
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

async function save() {
  if (!validateAll()) return;
  tableFormLoading.value = true;

  const ok = await confirm({ content: "Bạn chắc chắn muốn tạo bảng mới?" });
  if (!ok) {
    return;
  }

  const toastId = toast.add({
    title: "Đang xử lý...",
    color: "info",
    description: "Đang tạo bảng mới...",
  });

  const payload = getCleanTablePayload();
  const { data, error } = await useApi("/table_definition", {
    method: "post",
    body: payload,
  });

  toast.remove(toastId.id);

  if (data.value) {
    await fetchRoute();
    toast.add({
      title: "Thành công",
      color: "success",
      description: "Bảng mới đã được tạo!",
    });
    router.push(`/table/${data.value.name}`);
  } else {
    toast.add({
      title: "Lỗi",
      color: "error",
      description: error.value?.message,
    });
  }
  tableFormLoading.value = false;
}
</script>

<template>
  <UForm @submit.prevent="save" state="" ref="tableForm">
    <div class="mx-auto">
      <TableForm v-model="table" :new="true">
        <template #tableName>
          <UFormField :error="nameError" required>
            <UInput
              v-model="table.name"
              placeholder="Nhập tên bảng"
              class="w-full"
              size="xl"
              :error="nameError ? true : false"
              :color="nameError ? 'error' : 'primary'"
            />
          </UFormField>
        </template>
        <div class="space-y-6">
          <TableConstraints
            v-model="table"
            :column-names="table.columns.map((c: any) => c.name)"
          />
          <TableColumns v-model="table.columns" />
          <TableRelations
            v-model="table.relations"
            :table-options="tables.map((t) => ({ label: t.name, value: t.id }))"
          />
        </div>
      </TableForm>
    </div>
  </UForm>
</template>
