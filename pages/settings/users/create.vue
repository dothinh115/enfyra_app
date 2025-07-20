<template>
  <div class="mx-auto space-y-6">
    <DynamicFormEditor
      v-model="form"
      v-model:errors="errors"
      :table-name="tableName"
    />

    <div class="flex justify-end">
      <UButton
        label="Tạo người dùng"
        icon="i-heroicons-plus"
        :loading="loading"
        @click="handleCreate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();
const router = useRouter();

const tableName = "user_definition";

const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { generateEmptyForm, validate } = useSchema(tableName);

onMounted(() => {
  form.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors: validationErrors } = validate(form.value);
  errors.value = validationErrors;

  if (!isValid) {
    toast.add({
      title: "Dữ liệu không hợp lệ",
      description: "Vui lòng kiểm tra các trường bị lỗi.",
      color: "error",
    });
    return;
  }

  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    method: "post",
    body: form.value,
  });

  loading.value = false;

  if (error.value) {
    toast.add({
      title: "Tạo thất bại",
      description: error.value.message,
      color: "error",
    });
    return;
  }

  toast.add({
    title: "Tạo người dùng thành công",
    color: "success",
  });

  await router.push(`/settings/users/${data.value.data[0].id}`);
}
</script>
