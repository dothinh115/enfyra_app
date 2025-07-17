<template>
  <div class="mx-auto space-y-6">
    <UForm :state="createForm" ref="globalForm" @submit="handleCreate">
      <DynamicFormEditor
        v-model="createForm"
        :table-name="tableName"
        :errors="createErrors"
        @update:errors="(val) => (createErrors = val)"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const toast = useToast();
const createForm = ref<Record<string, any>>({});
const createErrors = ref<Record<string, string>>({});
const tableName = "hook_definition";

const { generateEmptyForm, getField } = useSchema(tableName);
const { globalForm } = useGlobalState();

onMounted(() => {
  createForm.value = generateEmptyForm();
});

function validate(): boolean {
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
      createErrors.value[key] = "Trường này là bắt buộc";
      isValid = false;
    } else {
      // ✅ chỉ xóa lỗi liên quan field này
      if (createErrors.value[key] === "Trường này là bắt buộc") {
        delete createErrors.value[key];
      }
    }
  }

  return isValid;
}

async function handleCreate() {
  const valid = validate();
  if (!valid || Object.keys(createErrors.value).length > 0) {
    toast.add({
      title: "Có lỗi",
      description: "Vui lòng kiểm tra lại các trường bị lỗi.",
      color: "error",
    });
    return;
  }
  const { data, error } = await useApiLazy(`/${tableName}`, {
    method: "post",
    body: createForm.value,
  });

  if (data.value?.data) {
    toast.add({
      title: "Tạo hook thành công",
      color: "success",
    });
    router.push(`/settings/hooks/${data.value.data[0].id}`);
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
