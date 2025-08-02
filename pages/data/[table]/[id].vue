<script setup lang="ts">
const route = useRoute();
const { globalForm, globalFormLoading } = useGlobalState();
const toast = useToast();
const { validate } = useSchema(route.params.table as string);
const updateErrors = ref<Record<string, string>>({});

const { confirm } = useConfirm();
const currentRecord = ref<Record<string, any>>({});
const loading = ref(false);

async function fetchRecord() {
  loading.value = true;
  
  const { data, error } = await useApiLazy(`/${route.params.table}`, {
    query: {
      fields: "*",
      filter: {
        id: {
          _eq: route.params.id,
        },
      },
    },
  });

  if (error.value) {
    toast.add({
      title: "Error",
      description: "Could not load record",
      color: "error",
    });
    loading.value = false;
    return;
  }

  currentRecord.value = data.value?.data?.[0] || {};
  loading.value = false;
}

onMounted(fetchRecord);

async function letsCreate() {
  const ok = await confirm({
    content: "Are you sure?",
  });
  if (ok) {
    await handleUpdate();
  }
}

async function handleUpdate() {
  const { isValid, errors } = validate(currentRecord.value);

  if (!isValid) {
    updateErrors.value = errors;
    toast.add({
      title: "Thiếu thông tin",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(
    `/${route.params.table}/${route.params.id}`,
    {
      method: "patch",
      body: currentRecord.value,
    }
  );

  if (error.value) {
    globalFormLoading.value = false;
    toast.add({
      title: "Error",
      color: "error",
      description: error.value.message || "Đã xảy ra lỗi",
    });
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Record updated!",
  });
  updateErrors.value = {};
  globalFormLoading.value = false;

  await navigateTo(`/data/${route.params.table}/${data.value.data[0].id}`);
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
    </div>
    <p class="text-sm text-muted-foreground">Loading record...</p>
  </div>

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
        <DynamicFormEditor
          :table-name="(route.params.table as string)"
          v-model="currentRecord"
          :excluded="['id']"
          v-model:errors="updateErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
