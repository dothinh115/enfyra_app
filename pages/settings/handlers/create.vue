<template>
  <div class="mx-auto space-y-6">
    <UForm state="createForm" ref="globalForm" @submit="handleCreate">
      <DynamicFormEditor
        v-model="createForm"
        :table-name="tableName"
        :errors="createErrors"
      />

      <div class="flex justify-end gap-2 pt-4 border-t border-muted">
        <UButton
          icon="lucide:plus"
          color="primary"
          :loading="creating"
          @click="handleCreate"
        >
          Tạo handler
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const toast = useToast();
const creating = ref(false);
const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});
const tableName = "route_handler_definition";
const { generateEmptyForm, getField } = useSchema(tableName);
const { globalForm } = useGlobalState();

onMounted(() => {
  createForm.value = generateEmptyForm();
  console.log(createForm.value);
});

function validate(): boolean {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const key of Object.keys(createForm.value)) {
    const field = getField(key);
    if (!field) continue;

    const val = createForm.value[key];
    const nullable = field.isNullable ?? true;

    const empty =
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "");

    if (!nullable && empty) {
      errors[key] = "Trường này là bắt buộc";
      isValid = false;
    }
  }

  createErrors.value = errors;
  return isValid;
}

async function handleCreate() {
  if (!validate()) return;
  creating.value = true;

  try {
    const { data } = await useApiLazy(`/${tableName}`, {
      method: "post",
      body: createForm.value,
    });

    toast.add({
      title: "Tạo handler thành công",
      color: "success",
    });

    router.push(`/settings/handlers/${data.value.data[0].id}`);
  } catch (e) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tạo handler",
      color: "error",
    });
  } finally {
    creating.value = false;
  }
}
</script>
