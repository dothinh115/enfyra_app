<template>
  <UForm :state="currentRecord" @submit="letsCreate" ref="globalForm">
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
          v-model="currentRecord"
          :excluded="['id']"
        />

        <!-- Hiển thị field quan hệ -->
        <div class="mt-6 space-y-4">
          <div
            v-for="relation in currentTable?.relations || []"
            :key="relation.propertyName"
          >
            <RelationInlineEditor
              :relationMeta="relation"
              v-model="currentRecord[relation.propertyName]"
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
const currentRecord = ref<Record<string, any>>({});

const { data } = await useApiLazy(`/${route.params.table}`, {
  query: {
    fields: "*",
    filter: {
      id: {
        _eq: route.params.id,
      },
    },
  },
});

onMounted(() => {
  currentRecord.value = data.value.data[0];
});

async function letsCreate() {
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (ok) {
    await handleUpdate();
  }
}

async function handleUpdate() {
  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(
    `/${route.params.table}/${route.params.id}`,
    {
      method: "patch",
      body: currentRecord.value,
    }
  );
  if (data.value.data) {
    toast.add({
      title: "Success",
      color: "success",
      description: "Record updated!",
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
