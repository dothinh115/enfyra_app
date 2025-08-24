<template>
  <div class="space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading role..."
        description="Fetching role details"
        size="sm"
        type="form"
        context="page"
      />

      <div v-else-if="apiData?.data?.[0]" class="space-y-6">
        <!-- Header - Full width -->
        <CommonPageHeader
          title="Role Details"
          title-size="md"
          show-background
          background-gradient="from-amber-500/6 via-yellow-400/4 to-transparent"
          padding-y="py-4"
        />

        <!-- Content - Limited width -->
        <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
          <UForm :state="form" @submit="save">
            <FormEditorLazy
              ref="formEditorRef"
              v-model="form"
              v-model:errors="errors"
              v-model:has-changes="hasFormChanges"
              :table-name="tableName"
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
      </div>

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

const { isMounted } = useMounted();

// Form changes tracking via FormEditor
const hasFormChanges = ref(false);
const formEditorRef = ref();

useHeaderActionRegistry([
  {
    id: "save-role",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    submit: save,
    loading: computed(() => updateLoading.value),
    disabled: computed(() => !hasFormChanges.value),
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

const form = ref<Record<string, any>>({});

// Initialize form data
async function initializeForm() {
  await fetchRole();
  const data = apiData.value?.data?.[0];
  if (data) {
    form.value = { ...data };
  }
}

const {
  execute: updateRole,
  pending: updateLoading,
  error: updateError,
} = useApiLazy(() => `/${tableName}/${id}`, {
  method: "patch",
  errorContext: "Update Role",
});

const {
  execute: deleteRoleApi,
  pending: deleteLoading,
  error: deleteError,
} = useApiLazy(() => `/${tableName}/${id}`, {
  method: "delete",
  errorContext: "Delete Role",
});

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

  await updateRole({ body: form.value });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "Role updated!",
  });
  errors.value = {};

  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

async function deleteRole() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  await deleteRoleApi();

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({ title: "Role deleted", color: "success" });
  await navigateTo("/settings/roles");
}

onMounted(() => {
  initializeForm();
});
</script>
