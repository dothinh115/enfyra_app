<script setup lang="ts">
const route = useRoute();
const { globalForm, globalFormLoading } = useGlobalState();
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

onMounted(() => fetchRecord());

async function letsCreate() {
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (ok) {
    await handleUpdate();
  }
}

// API composable for updating record
const { data: updateData, execute: updateRecord } = useApiLazy(
  () => `/${route.params.table}/${route.params.id}`,
  {
    method: "patch",
    errorContext: "Update Record",
  }
);

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

  globalFormLoading.value = true;

  try {
    await updateRecord({ body: currentRecord.value });

    toast.add({
      title: "Success",
      color: "success",
      description: "Record updated!",
    });
    updateErrors.value = {};

    await navigateTo(
      `/data/${route.params.table}/${updateData.value?.data[0]?.id}`
    );
  } finally {
    globalFormLoading.value = false;
  }
}
</script>

<template>
  <!-- Loading state -->
  <CommonLoadingState type="form" v-if="loading" />

  <!-- Form content -->
  <UForm v-else :state="currentRecord" @submit="letsCreate" ref="globalForm">
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
          v-model="currentRecord"
          :excluded="['id']"
          v-model:errors="updateErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
