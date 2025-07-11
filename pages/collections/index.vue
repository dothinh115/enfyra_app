<script setup lang="ts">
const router = useRouter();
const { tables, globalForm, globalFormLoading, fetchSchema } = useGlobalState();
const { confirm } = useConfirm();
const toast = useToast();
const errors = ref<Record<string, string>>({});
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
  if (!col.name?.trim()) {
    errors.value["name"] = "Tên cột là bắt buộc";
  } else if (!tableNameOrFieldRegexCheck.test(col.name.trim())) {
    errors.value["name"] = "Tên không hợp lệ";
  } else {
    delete errors.value["name"];
  }

  if (!col.type?.trim()) {
    errors.value["type"] = "Phải chọn kiểu dữ liệu";
  } else {
    delete errors.value["type"];
  }
}

function validateRelation(rel: any) {
  if (!rel.propertyName?.trim()) {
    errors.value.propertyName = "Tên quan hệ là bắt buộc";
    return false;
  } else if (!tableNameOrFieldRegexCheck.test(rel.propertyName.trim())) {
    errors.value.propertyName = "Tên không hợp lệ";
    return false;
  }

  if (!rel.type?.trim()) {
    errors.value.type = "Phải chọn loại quan hệ";
    return false;
  }

  if (!rel.targetTable) {
    errors.value.targetTable = "Phải chọn bảng đích";
    return false;
  }

  delete errors.value.propertyName;
  delete errors.value.type;
  delete errors.value.targetTable;
  return true;
}

function validateAll() {
  errors.value = {};

  // Validate table name
  const name = table.name.trim();
  if (name === "") {
    errors.value["name"] = "Không được để trống!";
  } else if (!tableNameOrFieldRegexCheck.test(name)) {
    errors.value["name"] = "Tên không hợp lệ";
  } else if (name === "table") {
    errors.value["name"] = "Tên bảng không được là `table`";
  }

  // Gọi validate cho từng column và relation
  for (const col of table.columns) {
    validateColumn(col); // tự gán vào error.value
  }

  for (const rel of table.relations) {
    validateRelation(rel);
  }

  // Nếu error vẫn trống → hợp lệ
  return Object.keys(errors.value).length === 0;
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
