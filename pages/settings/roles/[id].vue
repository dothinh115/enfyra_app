<template>
  <div class="mx-auto space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading role..."
      description="Fetching role details"
      size="sm"
      type="form"
      context="page"
    />

    <template v-else>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Role Details</h1>
        <UButton
          icon="i-heroicons-trash"
          label="Delete"
          color="error"
          variant="soft"
          :loading="createButtonLoader('delete-role').isLoading.value"
          @click="deleteRole"
        />
      </div>

      <UForm :state="form" ref="globalForm" @submit="save">
        <FormEditor
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

const errors = ref<Record<string, string>>({});
const { globalForm, globalFormLoading } = useGlobalState();
const { validate } = useSchema(tableName);
const { createButtonLoader } = useButtonLoading();

// API composable for fetching role
const {
  data: apiData,
  pending: loading,
  execute: fetchRole
} = useApiLazy(() => `/${tableName}`, {
  query: computed(() => ({
    fields: getIncludeFields(),
    filter: { id: { _eq: id } },
  })),
  errorContext: "Fetch Role"
});

// Form data as ref
const form = ref<Record<string, any>>({});

// Watch API data and update form
watch(apiData, (newData) => {
  if (newData?.data?.[0]) {
    form.value = { ...newData.data[0] };
  }
}, { immediate: true });

// API composable for updating role
const {
  execute: updateRole
} = useApiLazy(() => `/${tableName}/${id}`, {
  method: "patch",
  errorContext: "Update Role"
});

async function save() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Missing information",
      description: "Please check required fields.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  try {
    await updateRole({ body: form.value });
    toast.add({ title: "Role saved", color: "success" });
    errors.value = {};
  } finally {
    globalFormLoading.value = false;
  }
}

// API composable for deleting role
const {
  execute: removeRole
} = useApiLazy(() => `/${tableName}/${id}`, {
  method: "delete",
  errorContext: "Delete Role"
});

async function deleteRole() {
  const ok = await confirm({
    title: "Delete role?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  const deleteLoader = createButtonLoader("delete-role");
  await deleteLoader.withLoading(async () => {
    await removeRole();
    toast.add({ title: "Role deleted", color: "success" });
    await navigateTo("/settings/roles");
  });
}

onMounted(() => fetchRole());
</script>
