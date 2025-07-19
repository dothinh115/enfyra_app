<script setup lang="ts">
const route = useRoute();
const { globalForm, globalFormLoading } = useGlobalState();
const toast = useToast();
const { validate } = useSchema(route.params.table as string);
const updateErrors = ref<Record<string, string>>({});

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
  const { isValid, errors } = validate(currentRecord.value);

  if (!isValid) {
    updateErrors.value = errors;
    toast.add({
      title: "Thiếu thông tin",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(
    `/${route.params.table}/${route.params.id}`,
    {
      method: "patch",
      body: currentRecord.value,
    }
  );

  if (error.value) {
    globalFormLoading.value = false;
    toast.add({
      title: "Error",
      color: "error",
      description: error.value.message || "Đã xảy ra lỗi",
    });
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Record updated!",
  });
  updateErrors.value = {};
  globalFormLoading.value = false;

  await navigateTo(`/data/${route.params.table}/${data.value.data[0].id}`);
}
</script>

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
          v-model:errors="updateErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
