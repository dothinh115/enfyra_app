<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" ref="globalForm" @submit="handleCreate">
      <DynamicFormEditor
        v-model="createForm"
        :table-name="tableName"
        v-model:errors="createErrors"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

const tableName = "route_handler_definition";

const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema(tableName);
const { globalForm } = useGlobalState();

onMounted(() => {
  createForm.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors } = validate(createForm.value);

  if (!isValid) {
    createErrors.value = errors;
    toast.add({
      title: "Thiếu thông tin",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
      color: "error",
    });
    return;
  }

  const { data, error } = await useApiLazy(`/${tableName}`, {
    method: "post",
    body: createForm.value,
  });

  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: error.value.message,
      color: "error",
    });
    return;
  }

  toast.add({
    title: "Tạo handler thành công",
    color: "success",
  });

  await navigateTo(`/settings/handlers/${data.value.data[0].id}`);
}
</script>
