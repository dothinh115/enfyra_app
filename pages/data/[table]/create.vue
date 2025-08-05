<script setup lang="ts">
import { useApiLazyWithError } from "~/composables/useApiWithError";

const route = useRoute();
const { globalForm, globalFormLoading } = useGlobalState();
const toast = useToast();
const { confirm } = useConfirm();
const newRecord = ref<Record<string, any>>({});
const { generateEmptyForm, validate } = useSchema(route.params.table as string);
const createErrors = ref<Record<string, string>>({});

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

  globalFormLoading.value = true;

  const { data, error } = await useApiLazyWithError(`/${route.params.table}`, {
    method: "post",
    body: newRecord.value,
    errorContext: "Create Record",
  });

  if (data.value?.data) {
    toast.add({
      title: "Success",
      color: "success",
      description: "New record created!",
    });
    globalFormLoading.value = false;

    await navigateTo(`/data/${route.params.table}/${data.value.data[0].id}`);
  }
  globalFormLoading.value = false;
}
</script>

<template>
  <UForm :state="newRecord" @submit="handleCreate" ref="globalForm">
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
          v-model="newRecord"
          :excluded="['createdAt', 'updatedAt']"
          v-model:errors="createErrors"
        />
      </template>
    </UCard>
  </UForm>
</template>
