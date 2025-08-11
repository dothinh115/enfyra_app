<template>
  <div class="mx-auto space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State: khi chưa mounted hoặc đang loading -->
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading handler..."
        description="Fetching handler details"
        size="sm"
        type="form"
        context="page"
      />

      <!-- Form Content: khi có data -->
      <UForm v-else-if="handler" :state="form" @submit="save">
        <FormEditor
          v-model="form"
          :table-name="tableName"
          v-model:errors="errors"
        />
      </UForm>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <CommonEmptyState
        v-else
        title="Handler not found"
        description="The requested handler could not be loaded"
        icon="lucide:command-x"
        size="sm"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const id = route.params.id as string;
const tableName = "route_handler_definition";
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

// Mounted state để đánh dấu first render
const isMounted = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-handler",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: save,
    loading: computed(() => saveLoading.value),
    disabled: computed(() => form.value?.isSystem || false),
    permission: {
      and: [
        {
          route: "/route_handler_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-handler",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteHandler,
    loading: computed(() => deleteLoading.value),
    disabled: computed(() => form.value?.isSystem || false),
    permission: {
      and: [
        {
          route: "/route_handler_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

// Setup useApiLazy composables at top level
const {
  data: handlerData,
  pending: loading,
  execute: executeGetHandler,
} = useApiLazy(() => `/${tableName}`, {
  query: { fields: getIncludeFields(), filter: { id: { _eq: id } } },
  errorContext: "Fetch Handler",
});

const {
  error: saveError,
  execute: executeSaveHandler,
  pending: saveLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Save Handler",
});

const {
  error: deleteError,
  execute: executeDeleteHandler,
  pending: deleteLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Handler",
});

// Computed handler detail
const handler = computed(() => handlerData.value?.data?.[0]);

// Watch API data and update form
watch(
  handlerData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

async function save() {
  if (!form.value) return;

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

  try {
    await executeSaveHandler({ id, body: form.value });
    toast.add({
      title: "Success",
      color: "success",
      description: "Handler updated!",
    });
    errors.value = {};
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

async function deleteHandler() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  try {
    await executeDeleteHandler({ id });
    toast.add({ title: "Handler deleted", color: "success" });
    await navigateTo("/settings/handlers");
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

onMounted(async () => {
  await executeGetHandler();
  isMounted.value = true;
});
</script>
