<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});
const { generateEmptyForm, validate } = useSchema(route.params.table as string);
const createErrors = ref<Record<string, string>>({});

// Register header actions
useHeaderActionRegistry({
  id: "save-data-entry",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleCreate,
});

// API composable for creating record
const { data: createData, execute: createRecord } = useApiLazy(
  () => `/${route.params.table}`,
  {
    method: "post",
    errorContext: "Create Record",
  }
);

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
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (!ok) return;


  try {
    await createRecord({ body: newRecord.value });

    toast.add({
      title: "Success",
      color: "success",
      description: "New record created!",
    });

    await navigateTo(
      `/data/${route.params.table}/${createData.value?.data[0]?.id}`
    );
  } finally {
  }
}
</script>

<template>
  <UForm :state="newRecord" @submit="handleCreate" >
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
          v-model="newRecord"
          :excluded="['createdAt', 'updatedAt']"
          v-model:errors="createErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
