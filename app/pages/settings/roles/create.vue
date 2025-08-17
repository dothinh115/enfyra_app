<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" @submit="handleCreate">
      <FormEditor
        v-model="createForm"
        :table-name="tableName"
        v-model:errors="createErrors"
        :type-map="{
          routePermissions: {
            componentProps: {
              allowDelete: true,
            },
          },
        }"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

const tableName = "role_definition";

const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema(tableName);

// Setup useApiLazy composable at top level
const {
  data: createData,
  pending: createLoading,
  execute: createRole,
  error: createError,
} = useApiLazy(() => `/${tableName}`, {
  method: "post",
  errorContext: "Create Role",
});

// Register header actions
useHeaderActionRegistry({
  id: "save-role",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  loading: computed(() => createLoading.value),
  submit: handleCreate,
  permission: {
    and: [
      {
        route: "/role_definition",
        actions: ["create"],
      },
    ],
  },
});

onMounted(() => {
  createForm.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors } = validate(createForm.value);

  if (!isValid) {
    createErrors.value = errors;
    toast.add({
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  await createRole({ body: createForm.value });

  // Check if there was an error
  if (createError.value) {
    return;
  }

  toast.add({
    title: "Role created successfully",
    color: "success",
  });

  await navigateTo(`/settings/roles/${createData.value?.data[0]?.id}`);
}
</script>
