<template>
  <div class="mx-auto space-y-6">
    <UForm state="createForm" ref="globalForm" @submit="handleCreate">
      <DynamicFormEditor
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
const { globalForm } = useGlobalState();

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

  const { data, error } = await useApiLazy(`/${tableName}`, {
    method: "post",
    body: createForm.value,
  });

  if (error.value) {
    toast.add({
      title: "Error",
      description: error.value.message,
      color: "error",
    });
    return;
  }

  toast.add({
    title: "Route created successfully",
    color: "success",
  });

  await navigateTo(`/settings/routings/${data.value.data[0].id}`);
}
</script>
