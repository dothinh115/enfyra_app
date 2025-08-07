<script setup lang="ts">
const router = useRouter();
const { tables, globalLoading, fetchSchema } = useGlobalState();
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
    if (name === "") nameError.value = "Cannot be empty!";
    else if (!tableNameOrFieldRegexCheck.test(name))
      nameError.value =
        "Only letters, numbers, _ allowed. Cannot start with number or _!";
    else if (name === "table") nameError.value = "Table name cannot be `table`";
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
    errors.value["name"] = "Column name is required";
  } else if (!tableNameOrFieldRegexCheck.test(col.name.trim())) {
    errors.value["name"] = "Invalid name";
  } else {
    delete errors.value["name"];
  }

  if (!col.type?.trim()) {
    errors.value["type"] = "Must select data type";
  } else {
    delete errors.value["type"];
  }
}

function validateRelation(rel: any) {
  if (!rel.propertyName?.trim()) {
    errors.value.propertyName = "Relation name is required";
    return false;
  } else if (!tableNameOrFieldRegexCheck.test(rel.propertyName.trim())) {
    errors.value.propertyName = "Invalid name";
    return false;
  }

  if (!rel.type?.trim()) {
    errors.value.type = "Must select relation type";
    return false;
  }

  if (!rel.targetTable) {
    errors.value.targetTable = "Must select target table";
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
    errors.value["name"] = "Cannot be empty!";
  } else if (!tableNameOrFieldRegexCheck.test(name)) {
    errors.value["name"] = "Invalid name";
  } else if (name === "table") {
    errors.value["name"] = "Table name cannot be `table`";
  }

  // Call validate for each column and relation
  for (const col of table.columns) {
    validateColumn(col); // auto-assign to error.value
  }

  for (const rel of table.relations) {
    validateRelation(rel);
  }

  // If error still empty → valid
  return Object.keys(errors.value).length === 0;
}

function getCleanTablePayload() {
  const clone = JSON.parse(JSON.stringify(table));
  if (!clone.uniques?.length) delete clone.uniques;
  if (!clone.indexes?.length) delete clone.indexes;
  return clone;
}

// Register header actions
useHeaderActionRegistry({
  id: "create-table",
  label: "Create New Table",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  submit: save,
  class: "rounded-full",
});

// API composable for creating table
const { data: createData, execute: createTable } = useApiLazy(
  () => "/table_definition",
  {
    method: "post",
    errorContext: "Create Table",
  }
);

async function save() {
  if (!validateAll()) return;

  const ok = await confirm({ content: "Are u sure?" });
  if (!ok) {
    return;
  }

  globalLoading.value = true;

  try {
    const payload = getCleanTablePayload();
    await createTable({ body: payload });

    await fetchSchema();
    toast.add({
      title: "Success",
      color: "success",
      description: "New table created!",
    });
    router.push(`/collections/${createData.value?.data[0]?.name}`);
  } finally {
    globalLoading.value = false;
  }
}
</script>

<template>
  <UForm @submit.prevent="save" :state="table" >
    <div class="mx-auto">
      <TableForm v-model="table" :new="true">
        <template #tableName>
          <UFormField :error="nameError" required>
            <UInput
              v-model="table.name"
              placeholder="Enter table name"
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
