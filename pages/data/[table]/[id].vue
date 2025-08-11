<script setup lang="ts">
const route = useRoute();

const toast = useToast();
const { validate } = useSchema(route.params.table as string);
const updateErrors = ref<Record<string, string>>({});

const { confirm } = useConfirm();

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

// Form data as ref
const currentRecord = ref<Record<string, any>>({});

// Watch API data and update form
watch(
  apiData,
  (newData) => {
    if (newData?.data?.[0]) {
      currentRecord.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

onMounted(async () => await fetchRecord());

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

  toast.add({
    title: "Success",
    color: "success",
    description: "Record updated!",
  });
  updateErrors.value = {};

  await navigateTo(
    `/data/${route.params.table}/${updateData.value?.data[0]?.id}`
  );
}

// API composable for updating record
const {
  data: updateData,
  pending: updateLoading,
  execute: updateRecord,
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

  if (deleteError.value) {
    toast.add({
      title: "Error deleting",
      description: deleteError.value.message,
      color: "error",
    });
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
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading || !currentRecord.id"
      type="form"
      context="page"
      size="lg"
      :title="`Loading ${route.params.table}...`"
      :description="`Fetching record details`"
    />
    <!-- Form content - chỉ hiển thị khi có data thật sự -->
    <UCard v-else-if="currentRecord.id" variant="subtle">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold capitalize">
            {{ route.params.table }}: {{ currentRecord.id }}
          </div>
        </div>
      </template>

      <template #default>
        <FormEditor
          :table-name="(route.params.table as string)"
          mode="edit"
          v-model="currentRecord"
          v-model:errors="updateErrors"
        />
      </template>
    </UCard>
  </Transition>

  <!-- Debug info -->
  <div
    class="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs"
  >
    Loading: {{ loading }} | Has Data: {{ !!apiData?.data?.length }} | Record
    ID: {{ currentRecord.id }}
  </div>
</template>
