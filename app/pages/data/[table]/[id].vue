<script setup lang="ts">
const route = useRoute();

const toast = useToast();
const { validate } = useSchema(route.params.table as string);
const updateErrors = ref<Record<string, string>>({});
const { isMounted } = useMounted();
const { confirm } = useConfirm();

// Form changes tracking via FormEditor
const hasFormChanges = ref(false);
const formEditorRef = ref();

// API composable for fetching record
const {
  data: apiData,
  pending: loading,
  execute: fetchRecord,
} = useApiLazy(() => `/${route.params.table}`, {
  query: computed(() => ({
    fields: "*",
    filter: {
      id: {
        _eq: route.params.id,
      },
    },
  })),
  errorContext: "Fetch Record",
});

const currentRecord = computed(() => apiData.value?.data?.[0] || {});

onMounted(fetchRecord);

async function handleUpdate() {
  const { isValid, errors } = validate(currentRecord.value);

  if (!isValid) {
    updateErrors.value = errors;
    toast.add({
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  await updateRecord({
    id: route.params.id as string,
    body: currentRecord.value,
  });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Record updated!",
  });
  updateErrors.value = {};

  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

// API composable for updating record
const {
  data: updateData,
  pending: updateLoading,
  execute: updateRecord,
  error: updateError,
} = useApiLazy(() => `/${route.params.table}`, {
  method: "patch",
  errorContext: "Update Record",
});

// API composable for deleting record
const {
  error: deleteError,
  execute: executeDeleteRecord,
  pending: deleteLoading,
} = useApiLazy(() => `/${route.params.table}`, {
  method: "delete",
  errorContext: "Delete Record",
});

async function deleteRecord() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteRecord({ id: route.params.id as string });

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({
    title: "Record deleted",
    color: "success",
  });
  await navigateTo(`/data/${route.params.table}`);
}

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-data-entry",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    loading: computed(() => updateLoading.value),
    disabled: computed(() => !hasFormChanges.value),
    submit: handleUpdate,
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-data-entry",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    loading: computed(() => deleteLoading.value),
    onClick: deleteRecord,
    permission: {
      and: [
        {
          route: `/${route.params.table}`,
          actions: ["delete"],
        },
      ],
    },
  },
]);
const title = computed(() => {
  if (loading.value || !isMounted.value) return "Loading...";
  return `${route.params.table}: ${currentRecord.value.id}`;
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header - Full width -->
    <CommonPageHeader
      :title
      show-background
      background-gradient="from-cyan-500/6 via-blue-400/4 to-transparent"
      padding-y="py-6"
      title-size="md"
    />

    <!-- Content - Limited width -->
    <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
      <Transition name="loading-fade" mode="out-in">
        <!-- Loading state -->
        <CommonLoadingState
          v-if="loading || !isMounted"
          type="form"
          context="page"
          size="lg"
          :title="`Loading ${route.params.table}...`"
          :description="`Fetching record details`"
        />
        <!-- Form content -->
        <div v-else>
          <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
            <FormEditorLazy
              ref="formEditorRef"
              :table-name="(route.params.table as string)"
              mode="edit"
              v-model="currentRecord"
              v-model:errors="updateErrors"
              v-model:has-changes="hasFormChanges"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
