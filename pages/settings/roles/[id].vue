<template>
  <div class="mx-auto space-y-6">
    <div v-if="loading" class="flex justify-center py-8">
      <div class="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
    
    <template v-else>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Chi tiết vai trò</h1>
        <UButton
          icon="i-heroicons-trash"
          label="Xoá"
          color="error"
          variant="soft"
          :loading="createButtonLoader('delete-role').isLoading.value"
          @click="deleteRole"
        />
      </div>

      <UForm :state="form" ref="globalForm" @submit="save">
        <DynamicFormEditor
          v-model="form"
          :table-name="tableName"
          v-model:errors="errors"
          :type-map="{
            id: { disabled: true },
            createdAt: { disabled: true },
            updatedAt: { disabled: true },
            routePermissions: {
              componentProps: {
                allowDelete: true,
              },
            },
          }"
        />
      </UForm>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();

const id = route.params.id as string;
const tableName = "role_definition";
const { getIncludeFields } = useSchema(tableName);

const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { globalForm, globalFormLoading } = useGlobalState();
const { validate } = useSchema(tableName);
const { createButtonLoader } = useButtonLoading();

async function fetchRole() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    query: {
      fields: getIncludeFields(),
      filter: { id: { _eq: id } },
    },
  });

  if (error.value) {
    toast.add({
      title: "Không thể tải vai trò",
      color: "error",
    });
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
      description: "Vui lòng kiểm tra các trường bắt buộc.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

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
    toast.add({ title: "Đã lưu vai trò", color: "success" });
    errors.value = {};
  }

  globalFormLoading.value = false;
}

async function deleteRole() {
  const ok = await confirm({
    title: "Xoá vai trò?",
    content: "Hành động này không thể hoàn tác.",
  });
  if (!ok) return;

  const deleteLoader = createButtonLoader('delete-role');
  await deleteLoader.withLoading(async () => {
    const { error } = await useApiLazy(`/${tableName}/${id}`, {
      method: "delete",
    });

    if (error.value) {
      toast.add({
        title: "Không thể xoá vai trò",
        description: error.value.message,
        color: "error",
      });
      return;
    }

    toast.add({ title: "Đã xoá vai trò", color: "success" });
    await navigateTo("/settings/roles");
  });
}

onMounted(fetchRole);
</script>
