<script setup lang="ts">
const route = useRoute();
const { tables, globalForm, globalFormLoading, schemas } = useGlobalState();
const toast = useToast();
const currentTable = tables.value.find(
  (table) => table.name === route.params.table
);
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});

function createNewRecord() {
  if (!currentTable) return;
  const newRecord: any = {};
  for (const col of schemas.value[route.params.table as string].definition) {
    if (col.name === "id") continue;
    newRecord[col.name] = !currentTable.columns[col.name]?.isNullable
      ? currentTable.columns[col.name]?.defaultValue
      : null;
  }
  return newRecord;
}

onMounted(() => {
  newRecord.value = createNewRecord();
});

async function letsCreate() {
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (ok) {
    await handleCreate();
  }
}

async function handleCreate() {
  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(`/${route.params.table}`, {
    method: "post",
    body: newRecord.value,
  });
  if (data.value.data) {
    toast.add({
      title: "Success",
      color: "success",
      description: "New record created!",
    });
    globalFormLoading.value = false;
    await navigateTo(`/data/${route.params.table}/${data.value.data[0].id}`);
  }
  if (error.value) {
    globalFormLoading.value = false;

    toast.add({
      title: "Error",
      color: "error",
      description: error.value?.message,
    });
  }
}
</script>

<template>
  <UForm :state="newRecord" @submit="letsCreate" ref="globalForm">
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold capitalize">
            {{ route.params.table }}: new record
          </div>
        </div>
      </template>

      <template #default>
        <DynamicFormEditor
          :table-name="(route.params.table as string)"
          v-model="newRecord"
          :excluded="['createdAt', 'updatedAt']"
        />
      </template>
    </UCard>
  </UForm>
</template>
