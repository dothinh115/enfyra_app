<script setup lang="ts">
import { useApiLazyWithError } from "~/composables/useApiWithError";

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

  const { data, error } = await useApiLazyWithError(`/${route.params.table}`, {
    query: {
      fields: "*",
      filter: {
        id: {
          _eq: route.params.id,
        },
      },
    },
    errorContext: "Fetch Record",
  });

  loading.value = false;
  currentRecord.value = data.value?.data?.[0] || {};
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
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  const { data, error } = await useApiLazyWithError(
    `/${route.params.table}/${route.params.id}`,
    {
      method: "patch",
      body: currentRecord.value,
      errorContext: "Update Record",
    }
  );

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
  <div
    v-if="loading"
    class="flex flex-col items-center justify-center py-20 gap-4"
  >
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div
        class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"
      ></div>
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
