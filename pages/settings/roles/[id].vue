<template>
  <div class="mx-auto space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading role..."
      description="Fetching role details"
      size="sm"
      type="form"
      context="page"
    />

    <template v-else>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Role Details</h1>
      </div>

      <UForm :state="form" @submit="save">
        <FormEditor
          v-model="form"
          :table-name="tableName"
          v-model:errors="errors"
          :type-map="{
            routePermissions: {
              componentProps: {
                allowDelete: true,
              },
            },
          }"
        />
      </UForm>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();

const id = route.params.id as string;
const tableName = "role_definition";
const { getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-role",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    submit: save,
    loading: computed(() => updateLoading.value),
    permission: {
      and: [
        {
          route: "/role_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-role",
    label: "Delete",
    icon: "lucide:trash",
    variant: "soft",
    color: "error",
    onClick: deleteRole,
    loading: computed(() => deleteLoading.value),
    permission: {
      and: [
        {
          route: "/role_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

const errors = ref<Record<string, string>>({});

const { validate } = useSchema(tableName);

// API composable for fetching role
const {
  data: apiData,
  pending: loading,
  execute: fetchRole,
} = useApiLazy(() => `/${tableName}`, {
  query: computed(() => ({
    fields: getIncludeFields(),
    filter: { id: { _eq: id } },
  })),
  errorContext: "Fetch Role",
});

// Form data as ref
const form = ref<Record<string, any>>({});

// Watch API data and update form
watch(
  apiData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

// API composable for updating role
const {
  execute: updateRole,
  pending: updateLoading,
  error: updateError,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Role",
});

async function save() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Missing information",
      description: "Please check required fields.",
      color: "error",
    });
    return;
  }

  await updateRole({ id, body: form.value });

  if (updateError.value) {
    return;
  }

  toast.add({ title: "Role saved", color: "success" });
  errors.value = {};
}

// API composable for deleting role
const {
  execute: removeRole,
  pending: deleteLoading,
  error: deleteError,
} = useApiLazy(() => `/${tableName}`, {
  method: "delete",
  errorContext: "Delete Role",
});

async function deleteRole() {
  const ok = await confirm({
    title: "Delete role?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  await removeRole({ id });

  if (deleteError.value) {
    return;
  }

  toast.add({ title: "Role deleted", color: "success" });
  await navigateTo("/settings/roles");
}

onMounted(() => fetchRole());
</script>
