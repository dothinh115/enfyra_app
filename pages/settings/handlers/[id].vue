<template>
  <div class="mx-auto space-y-6">
    <UForm :state="form" ref="globalForm" @submit="save">
      <DynamicFormEditor
        v-model="form"
        :table-name="tableName"
        v-model:errors="errors"
        :type-map="{
          id: {
            disabled: true,
          },
          createdAt: {
            disabled: true,
          },
          updatedAt: {
            disabled: true,
          },
        }"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();

const id = route.params.id as string;
const tableName = "route_handler_definition";

const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);

const { globalForm } = useGlobalState();
const { validate } = useSchema(tableName);

async function fetchHandler() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    query: { fields: "*", filter: { id: { _eq: id } } },
  });

  if (error.value) {
    toast.add({ title: "Không thể tải handler", color: "error" });
    loading.value = false;
    return;
  }

  form.value = data.value?.data?.[0] || {};
  loading.value = false;
}

async function save() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Thiếu thông tin",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
      color: "error",
    });
    return;
  }

  saving.value = true;

  const { error } = await useApiLazy(`/${tableName}/${id}`, {
    method: "patch",
    body: form.value,
  });

  if (error.value) {
    toast.add({
      title: "Lỗi khi lưu",
      description: error.value.message,
      color: "error",
    });
  } else {
    toast.add({ title: "Đã lưu handler", color: "success" });
    errors.value = {};
  }

  saving.value = false;
}

onMounted(fetchHandler);
</script>
