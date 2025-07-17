<template>
  <div class="mx-auto space-y-6">
    <UForm :state="form" ref="globalForm" @submit="save">
      <DynamicFormEditor
        v-model="form"
        :table-name="tableName"
        :errors="errors"
        :type-map="{
          id: {
            disabled: true,
          },
          createdAt: {
            disabled: true,
          },
          updatedAt: {
            disabled: true,
          },
        }"
      />
    </UForm>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();

const id = route.params.id as string;
const tableName = "route_handler_definition";

const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);
const { globalForm } = useGlobalState();
const { getField } = useSchema(tableName);

async function fetchHandler() {
  loading.value = true;
  try {
    const { data } = await useApiLazy(`/${tableName}`, {
      query: { fields: "*", filter: { id: { _eq: route.params.id } } },
    });
    form.value = data.value.data[0];
  } catch (e) {
    toast.add({ title: "Không thể tải handler", color: "error" });
  } finally {
    loading.value = false;
  }
}

// Validate trước khi lưu
function validate(): boolean {
  const result: Record<string, string> = {};
  let valid = true;

  for (const key of Object.keys(form.value)) {
    const field = getField(key);
    if (!field) continue;

    const nullable = field.isNullable ?? true;
    const value = form.value[key];

    const empty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (!nullable && empty) {
      result[key] = "Trường này là bắt buộc";
      valid = false;
    }
  }

  errors.value = result;
  return valid;
}

async function save() {
  if (!validate()) return;
  saving.value = true;
  try {
    await useApiLazy(`/${tableName}/${id}`, {
      method: "patch",
      body: form.value,
    });
    toast.add({ title: "Đã lưu handler", color: "success" });
  } catch (e) {
    toast.add({ title: "Lỗi khi lưu", color: "error" });
  } finally {
    saving.value = false;
  }
}

onMounted(fetchHandler);
</script>
