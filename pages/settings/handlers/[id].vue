<template>
  <div class="mx-auto space-y-6">
    <!-- Loading state -->
    <CommonLoadingState
      v-if="loading"
      title="Loading handler..."
      description="Fetching handler details"
      size="sm"
      type="form"
      context="page"
    />

    <!-- Form content -->
    <UForm v-else :state="form" @submit="save">
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

const { validate, getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry({
  id: "save-handler",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: save,
  loading: computed(() => saveLoading.value),
  permission: {
    and: [
      {
        route: "/route_handler_definition",
        actions: ["update"],
      },
    ],
  },
});

// Setup useApiLazy composables at top level
const {
  data: handlerData,
  error: fetchError,
  execute: executeGetHandler,
} = useApiLazy(() => `/${tableName}`, {
  query: { fields: getIncludeFields(), filter: { id: { _eq: id } } },
});

const {
  error: saveError,
  execute: executeSaveHandler,
  pending: saveLoading,
} = useApiLazy(() => `/${tableName}/${id}`, {
  method: "patch",
});

async function fetchHandler() {
  loading.value = true;

  try {
    await executeGetHandler();

    if (fetchError.value) {
      toast.add({ title: "Cannot load handler", color: "error" });
      loading.value = false;
      return;
    }

    form.value = handlerData.value?.data?.[0] || {};
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
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

  try {
    await executeSaveHandler({ body: form.value });

    if (saveError.value) {
      toast.add({
        title: "Error saving",
        description: saveError.value.message,
        color: "error",
      });
    } else {
      toast.add({ title: "Handler saved", color: "success" });
      errors.value = {};
    }
  } catch (error) {
    // Error already handled by useApiLazy
  }

  saving.value = false;
}

onMounted(fetchHandler);
</script>
