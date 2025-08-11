<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading hook..."
      description="Fetching hook details"
      size="sm"
      type="form"
      context="page"
    />

    <UForm
      v-else-if="detail"
      :state="form"
      @submit="updateHook"
      class="space-y-6"
    >
      <div class="flex items-center gap-3">
        <Icon name="lucide:zap" class="text-2xl text-primary" />
        <div class="text-xl font-bold text-primary">
          Hook: {{ detail.name || "(no name)" }}
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <UBadge color="primary" v-if="detail.isSystem"
                >System Hook</UBadge
              >
              <UBadge color="secondary" v-if="detail.isEnabled">Enabled</UBadge>
            </div>
          </div>
        </template>

        <FormEditor
          v-model="form"
          v-model:errors="errors"
          :table-name="'hook_definition'"
          :excluded="['isSystem']"
        />
      </UCard>
    </UForm>

    <CommonEmptyState
      v-else
      title="Hook not found"
      description="The requested hook could not be loaded"
      icon="lucide:zap"
      size="sm"
    />
  </Transition>
</template>

<script setup lang="ts">
const route = useRoute();

const toast = useToast();
const tableName = "hook_definition";
const { confirm } = useConfirm();

const id = route.params.id as string;

const { isMounted } = useMounted();

const { validate, getIncludeFields } = useSchema(tableName);

useHeaderActionRegistry([
  {
    id: "save-hook",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: updateHook,
    loading: computed(() => updateLoading.value),
    permission: {
      and: [
        {
          route: "/hook_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-hook",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteHook,
    loading: computed(() => deleteLoading.value),
    permission: {
      and: [
        {
          route: "/hook_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

const {
  data: hookData,
  pending: loading,
  execute: executeGetHook,
} = useApiLazy(() => `/${tableName}`, {
  query: { fields: getIncludeFields(), filter: { id: { _eq: id } } },
  errorContext: "Fetch Hook",
});

const {
  error: updateError,
  execute: executeUpdateHook,
  pending: updateLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Hook",
});

const {
  error: deleteError,
  execute: executeDeleteHook,
  pending: deleteLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Hook",
});

const detail = computed(() => hookData.value?.data?.[0]);

const form = ref<Record<string, any>>({});

const errors = ref<Record<string, string>>({});

watch(
  hookData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

async function updateHook() {
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

  await executeUpdateHook({ id, body: form.value });

  // Check if there was an error
  if (updateError.value) {
    // Error already handled by useApiLazy
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Hook updated!",
  });
  errors.value = {};
}

async function deleteHook() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteHook({ id });

  // Check if there was an error
  if (deleteError.value) {
    // Error already handled by useApiLazy
    return;
  }

  toast.add({ title: "Hook deleted", color: "success" });
  await navigateTo("/settings/hooks");
}

onMounted(async () => {
  await executeGetHook();
});
</script>
