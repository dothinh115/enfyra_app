<script setup lang="ts">
const router = useRouter();
const { tables, globalForm, globalFormLoading, fetchSchema } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();

const table = reactive<any>({
  name: "",
  description: "",
  columns: [],
  relations: [],
  uniques: [],
  indexes: [],
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
  () => table.columns.type,
  (newType) => {
    const notIndexableTypes = ["text", "json"];
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
  let isValid = true;

  const name = table.name.trim();
  if (name === "") {
    nameError.value = "Không được để trống!";
    isValid = false;
  } else if (!tableNameOrFieldRegexCheck.test(name)) {
    nameError.value =
      "Chỉ cho phép chữ cái, số, _ và không bắt đầu bằng số hoặc _!";
    isValid = false;
  } else if (name === "table") {
    nameError.value = "Tên table không được là `table`";
    isValid = false;
  } else {
    nameError.value = "";
    isValid = true;
  }

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
  if (!clone.uniques?.length) delete clone.uniques;
  if (!clone.indexes?.length) delete clone.indexes;
  return clone;
}

async function save() {
  if (!validateAll()) return;
  globalFormLoading.value = true;

  const ok = await confirm({ content: "Are u sure?" });
  if (!ok) {
    return;
  }

  const toastId = toast.add({
    title: "Loading...",
    color: "info",
    description: "Creating new table...",
  });

  const payload = getCleanTablePayload();
  const { data, error } = await useApiLazy("/table_definition", {
    method: "post",
    body: payload,
  });
  toast.remove(toastId.id);

  if (data.value) {
    await fetchSchema();
    toast.add({
      title: "Success",
      color: "success",
      description: "New table created!",
    });
    router.push(`/collections/${data.value.data[0].name}`);
  } else {
    toast.add({
      title: "Error",
      color: "error",
      description: error.value?.message,
    });
  }
  globalFormLoading.value = false;
}
</script>

<template>
  <UForm @submit.prevent="save" :state="table" ref="globalForm">
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
