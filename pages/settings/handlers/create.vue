<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" @submit="handleCreate">
      <FormEditor
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

// Register header actions
useHeaderActionRegistry({
  id: "save-handler",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleCreate,
  loading: computed(() => createLoading.value),
  permission: {
    and: [
      {
        route: "/route_handler_definition",
        actions: ["create"],
      },
    ],
  },
});

// Setup useApiLazy composable at top level
const {
  data: createData,
  error: createError,
  execute: executeCreateHandler,
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
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  try {
    await executeCreateHandler({ body: createForm.value });

    if (createError.value) {
      toast.add({
        title: "Error",
        description: createError.value.message,
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Handler created successfully",
      color: "success",
    });

    await navigateTo(`/settings/handlers/${createData.value.data[0].id}`);
  } catch (error) {
    // Error already handled by useApiLazy
  }
}
</script>
