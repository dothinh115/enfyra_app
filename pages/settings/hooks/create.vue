<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm"  @submit="handleCreate">
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

const tableName = "hook_definition";

const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema(tableName);


useHeaderActionRegistry({
  id: "save-hook",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleCreate,
});

// Setup useApiLazy composable at top level
const {
  data: createData,
  error: createError,
  execute: executeCreateHook,
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
      title: "Validation error",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  try {
    await executeCreateHook({ body: createForm.value });

    if (createError.value) {
      toast.add({
        title: "Error",
        description: createError.value.message,
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Hook created successfully",
      color: "success",
    });

    await navigateTo(`/settings/hooks/${createData.value.data[0].id}`);
  } catch (error) {
    // Error already handled by useApiLazy
  }
}
</script>
