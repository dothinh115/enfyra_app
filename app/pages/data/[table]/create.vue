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
  <div class="space-y-6">
    <!-- Header - Full width -->
    <CommonPageHeader
      :title="`Create New ${route.params.table} Record`"
      title-size="lg"
      show-background
      background-gradient="from-cyan-500/6 via-blue-400/4 to-transparent"
      padding-y="py-6"
    />

    <!-- Content - Limited width -->
    <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
      <UForm :state="newRecord" @submit="handleCreate">
        <FormEditorLazy
          :table-name="(route.params.table as string)"
          mode="create"
          v-model="newRecord"
          v-model:errors="createErrors"
        />
      </UForm>
    </div>
  </div>
</template>
