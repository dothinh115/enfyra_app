<script setup lang="ts">
const route = useRoute();
const { globalForm, globalFormLoading } = useGlobalState();
const toast = useToast();
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});
const { generateEmptyForm, validate } = useSchema(route.params.table as string);
const createErrors = ref<Record<string, string>>({});

onMounted(() => {
  newRecord.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors } = validate(newRecord.value);

  if (!isValid) {
    createErrors.value = errors;
    toast.add({
      title: "Thiếu thông tin",
      color: "error",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
    });
    return;
  }
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (!ok) return;

  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(`/${route.params.table}`, {
    method: "post",
    body: newRecord.value,
  });

  if (data.value?.data) {
    toast.add({
      title: "Success",
      color: "success",
      description: "New record created!",
    });
    globalFormLoading.value = false;

    await navigateTo(`/data/${route.params.table}/${data.value.data[0].id}`);
  } else if (error.value) {
    globalFormLoading.value = false;
    toast.add({
      title: "Error",
      color: "error",
      description: error.value.message || "Đã xảy ra lỗi",
    });
  }
}
</script>

<template>
  <UForm :state="newRecord" @submit="handleCreate" ref="globalForm">
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
          v-model:errors="createErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
