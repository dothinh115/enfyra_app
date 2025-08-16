<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});
const { generateEmptyForm, validate } = useSchema(route.params.table as string);
const createErrors = ref<Record<string, string>>({});

// API composable for creating record
const {
  data: createData,
  pending: createLoading,
  execute: createRecord,
  error: createError,
} = useApiLazy(() => `/${route.params.table}`, {
  method: "post",
  errorContext: "Create Record",
});

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-data-entry",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    loading: computed(() => createLoading.value),
    submit: handleCreate,
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["create"],
        },
      ],
    },
  },
]);

onMounted(() => {
  newRecord.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors } = validate(newRecord.value);

  if (!isValid) {
    createErrors.value = errors;
    toast.add({
      title: "Missing information",
      color: "error",
      description: "Please fill in all required fields.",
    });
    return;
  }

  await createRecord({ body: newRecord.value });

  // Check if there was an error
  if (createError.value) {
    // Error already handled by useApiLazy
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "New record created!",
  });

  await navigateTo(
    `/data/${route.params.table}/${createData.value?.data[0]?.id}`
  );
}
</script>

<template>
  <UForm :state="newRecord" @submit="handleCreate">
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold capitalize">
            {{ route.params.table }}: new record
          </div>
        </div>
      </template>

      <template #default>
        <FormEditor
          :table-name="(route.params.table as string)"
          mode="create"
          v-model="newRecord"
          v-model:errors="createErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
