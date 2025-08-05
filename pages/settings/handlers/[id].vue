<template>
  <div class="mx-auto space-y-6">
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading"
      title="Loading handler..."
      description="Fetching handler details"
      size="sm"
    />

    <!-- Form content -->
    <UForm v-else :state="form" ref="globalForm" @submit="save">
      <FormEditor
        v-model="form"
        :table-name="tableName"
        v-model:errors="errors"
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
const { validate, getIncludeFields } = useSchema(tableName);

async function fetchHandler() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    query: { fields: getIncludeFields(), filter: { id: { _eq: id } } },
  });

  if (error.value) {
    toast.add({ title: "Cannot load handler", color: "error" });
    loading.value = false;
    return;
  }

  form.value = data.value?.data?.[0] || {};
  loading.value = false;
}

async function save() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Missing information",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  saving.value = true;

  const { error } = await useApiLazy(`/${tableName}/${id}`, {
    method: "patch",
    body: form.value,
  });

  if (error.value) {
    toast.add({
      title: "Error saving",
      description: error.value.message,
      color: "error",
    });
  } else {
    toast.add({ title: "Handler saved", color: "success" });
    errors.value = {};
  }

  saving.value = false;
}

onMounted(fetchHandler);
</script>
