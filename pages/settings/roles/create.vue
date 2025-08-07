<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" ref="globalForm" @submit="handleCreate">
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
const { globalForm } = useGlobalState();

// Register header actions
useHeaderActionRegistry({
  id: "save-role",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleCreate,
});

// Setup useApiLazy composable at top level
const { data: createData, execute: createRole } = useApiLazy(
  () => `/${tableName}`,
  {
    method: "post",
    errorContext: "Create Role",
  }
);

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

  toast.add({
    title: "Role created successfully",
    color: "success",
  });

  await navigateTo(`/settings/roles/${createData.value?.data[0]?.id}`);
}
</script>
