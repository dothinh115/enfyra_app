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
        />

        <!-- Hiển thị field quan hệ -->
        <div class="mt-6 space-y-4">
          <div
            v-for="relation in currentTable?.relations || []"
            :key="relation.propertyName"
          >
            <RelationInlineEditor
              :relationMeta="relation"
              v-model="newRecord[relation.propertyName]"
            />
          </div>
        </div>
      </template>
    </UCard>
  </UForm>
</template>

<script setup lang="ts">
const route = useRoute();
const { tables, globalForm, globalFormLoading } = useGlobalState();
const toast = useToast();
const currentTable = tables.value.find(
  (table) => table.name === route.params.table
);
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});

function createNewRecord() {
  if (!currentTable) return;
  const newRecord: any = {};
  for (const col of currentTable.columns) {
    if (col.name === "id") continue;
    newRecord[col.name] = !col.isNullable ? col.defaultValue : null;
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
