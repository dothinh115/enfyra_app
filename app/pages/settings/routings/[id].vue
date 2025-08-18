<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading route..."
      description="Fetching route details"
      size="sm"
      type="form"
      context="page"
    />

    <UForm
      v-else-if="detail"
      :state="form"
      @submit="updateRoute"
      class="space-y-6"
    >
      <div class="flex items-center gap-3">
        <UIcon
          :name="detail.icon || 'lucide:circle'"
          class="text-2xl text-primary"
        />
        <div class="text-xl font-bold text-primary">
          Route: {{ detail.path }}
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <UBadge color="primary" v-if="form.isSystem">System Route</UBadge>
              <UBadge color="secondary" v-if="form.isEnabled">Enabled</UBadge>
            </div>
          </div>
        </template>

        <FormEditorLazy
          ref="formEditorRef"
          v-model="form"
          v-model:errors="errors"
          v-model:has-changes="hasFormChanges"
          :table-name="tableName"
          :excluded="['isSystem', 'routePermissions', 'middlewares']"
          :type-map="{
            handlers: {
              componentProps: { allowDelete: true },
            },
          }"
        />
      </UCard>
    </UForm>

    <CommonEmptyState
      v-else
      title="Route not found"
      description="The requested route could not be loaded"
      icon="lucide:route"
      size="sm"
    />
  </Transition>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();

const tableName = "route_definition";

const { isMounted } = useMounted();

// Form changes tracking via FormEditor
const hasFormChanges = ref(false);
const formEditorRef = ref();

const { validate, getIncludeFields } = useSchema(tableName);

useHeaderActionRegistry([
  {
    id: "save-routing",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: updateRoute,
    loading: computed(() => updateLoading.value),
    disabled: computed(() => !hasFormChanges.value),
    permission: {
      and: [
        {
          route: "/route_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-routing",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteRoute,
    loading: computed(() => deleteLoading.value),
    permission: {
      and: [
        {
          route: "/route_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

const {
  data: routeData,
  pending: loading,
  execute: executeGetRoute,
} = useApiLazy(() => `/${tableName}`, {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: route.params.id } },
  },
  errorContext: "Fetch Route",
});

const {
  error: updateError,
  execute: executeUpdateRoute,
  pending: updateLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Route",
});

const {
  error: deleteError,
  execute: executeDeleteRoute,
  pending: deleteLoading,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Route",
});

const detail = computed(() => routeData.value?.data?.[0]);

const form = ref<Record<string, any>>({});

const errors = ref<Record<string, string>>({});

watch(
  routeData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

async function updateRoute() {
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

  await executeUpdateRoute({
    id: route.params.id as string,
    body: form.value,
  });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Route updated!",
  });
  errors.value = {};
  
  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

async function deleteRoute() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await executeDeleteRoute({ id: route.params.id as string });

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({ title: "Route deleted", color: "success" });
  await navigateTo("/settings/routings");
}

onMounted(async () => {
  await executeGetRoute();
});
</script>
