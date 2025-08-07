<template>
  <div class="mx-auto space-y-6">
    <UForm state="createForm" @submit="handleCreate">
      <FormEditor
        v-model="createForm"
        :table-name="tableName"
        :errors="createErrors"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

const tableName = "route_definition";

const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry({
  id: "save-routing",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleCreate,
  loading: computed(() => createLoading.value),
  permission: {
    and: [
      {
        route: "/route_definition",
        actions: ["create"],
      },
    ],
  },
});

// Setup useApiLazy composable at top level
const {
  data: createData,
  error: createError,
  execute: executeCreateRoute,
  pending: createLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "post",
});

onMounted(() => {
  createForm.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors } = validate(createForm.value);

  if (!isValid) {
    createErrors.value = errors;
    toast.add({
      title: "Error",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  try {
    await executeCreateRoute({ body: createForm.value });

    if (createError.value) {
      toast.add({
        title: "Error",
        description: createError.value.message,
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Route created successfully",
      color: "success",
    });

    await navigateTo(`/settings/routings/${createData.value.data[0].id}`);
  } catch (error) {
    // Error already handled by useApiLazy
  }
}
</script>
