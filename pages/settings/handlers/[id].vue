<template>
  <div class="mx-auto space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="relative">
        <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
        <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-muted-foreground">Loading handler...</p>
    </div>

    <!-- Form content -->
    <UForm v-else :state="form" ref="globalForm" @submit="save">
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
const { validate, getIncludeFields } = useSchema(tableName);

async function fetchHandler() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    query: { fields: getIncludeFields(), filter: { id: { _eq: id } } },
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
