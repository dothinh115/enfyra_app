<template>
  <div class="mx-auto space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State: khi chưa mounted hoặc đang loading -->
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading role..."
        description="Fetching role details"
        size="sm"
        type="form"
        context="page"
      />

      <!-- Form Content: khi có data -->
      <div v-else-if="role" class="space-y-6">
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
      </div>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <CommonEmptyState
        v-else
        title="Role not found"
        description="The requested role could not be loaded"
        icon="lucide:shield-x"
        size="sm"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();

const id = route.params.id as string;
const tableName = "role_definition";
const { getIncludeFields } = useSchema(tableName);

// Mounted state để đánh dấu first render
const isMounted = ref(false);

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

// Computed role detail
const role = computed(() => apiData.value?.data?.[0]);

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
const { execute: updateRole, pending: updateLoading } = useApiLazy(
  () => `/${tableName}/${id}`,
  {
    method: "patch",
    errorContext: "Update Role",
  }
);

// API composable for deleting role
const { execute: deleteRoleApi, pending: deleteLoading } = useApiLazy(
  () => `/${tableName}/${id}`,
  {
    method: "delete",
    errorContext: "Delete Role",
  }
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
    await updateRole({ body: form.value });
    toast.add({
      title: "Success",
      color: "success",
      description: "Role updated!",
    });
    errors.value = {};
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

async function deleteRole() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  try {
    await deleteRoleApi();
    toast.add({ title: "Role deleted", color: "success" });
    await navigateTo("/settings/roles");
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

onMounted(async () => {
  await fetchRole();
  isMounted.value = true;
});
</script>
