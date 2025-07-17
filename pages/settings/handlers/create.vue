<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" ref="globalForm" @submit="handleCreate">
      <DynamicFormEditor
        v-model="createForm"
        :table-name="tableName"
        v-model:errors="createErrors"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const toast = useToast();
const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});
const tableName = "route_handler_definition";
const { generateEmptyForm, getField } = useSchema(tableName);
const { globalForm } = useGlobalState();

onMounted(() => {
  createForm.value = generateEmptyForm();
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

  const { data, error } = await useApiLazy(`/${tableName}`, {
    method: "post",
    body: createForm.value,
  });
  if (data.value?.data) {
    toast.add({
      title: "Tạo handler thành công",
      color: "success",
    });
    router.push(`/settings/handlers/${data.value.data[0].id}`);
  }
  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: error.value.message,
      color: "error",
    });
  }
}
</script>
