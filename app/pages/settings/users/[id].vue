<script setup lang="ts">
const route = useRoute();
const toast = useToast();
const { confirm } = useConfirm();
const { validate } = useSchema("user_definition");

const { isMounted } = useMounted();

// Form changes tracking via FormEditor
const hasFormChanges = ref(false);
const formEditorRef = ref();

const {
  data: apiData,
  pending: loading,
  execute: fetchUser,
} = useApiLazy(() => "/user_definition", {
  query: computed(() => ({
    fields: "*",
    filter: {
      id: {
        _eq: route.params.id,
      },
    },
  })),
  errorContext: "Fetch User",
});

const form = ref<Record<string, any>>({});

const errors = ref<Record<string, string>>({});

watch(
  apiData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
);

const {
  execute: updateUser,
  pending: updateLoading,
  error: updateError,
} = useApiLazy(() => `/user_definition/${route.params.id}`, {
  method: "patch",
  errorContext: "Update User",
});

const {
  execute: removeUser,
  pending: deleteLoading,
  error: deleteError,
} = useApiLazy(() => `/user_definition/${route.params.id}`, {
  method: "delete",
  errorContext: "Delete User",
});

useHeaderActionRegistry([
  {
    id: "save-user",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    loading: computed(() => updateLoading.value),
    disabled: computed(() => !hasFormChanges.value),
    submit: saveUser,
    permission: {
      and: [
        {
          route: "/user_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-user",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    loading: computed(() => deleteLoading.value),
    onClick: deleteUser,
    permission: {
      and: [
        {
          route: "/user_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

async function saveUser() {
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

  await updateUser({ body: form.value });

  // Check if there was an error
  if (updateError.value) {
    return;
  }

  toast.add({
    title: "Success",
    color: "success",
    description: "User updated!",
  });
  errors.value = {};

  // Confirm form changes as new baseline
  formEditorRef.value?.confirmChanges();
}

async function deleteUser() {
  const ok = await confirm({
    content: `Are you sure you want to delete user "${apiData.value?.data?.[0]?.name}"?`,
  });
  if (!ok) return;

  await removeUser();

  // Check if there was an error
  if (deleteError.value) {
    return;
  }

  toast.add({
    title: "User deleted",
    color: "success",
  });
  await navigateTo("/settings/users");
}

async function fetchUserDetail(userId: string) {
  await fetchUser();

  // Check if there was an error
  if (apiData.value?.error) {
    return;
  }

  if (!apiData.value?.data?.[0]) {
    toast.add({
      title: "User not found",
      description: "Invalid ID",
      color: "error",
    });
    await navigateTo("/settings/users");
  }
}

onMounted(async () => {
  await fetchUserDetail(route.params.id as string);
});

watch(
  () => route.params.id,
  (newId) => fetchUserDetail(newId as string)
);
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading user..."
      description="Fetching user details"
      size="sm"
      type="form"
      context="page"
    />

    <div v-else-if="apiData?.data?.[0]" class="space-y-6">
      <!-- Header - Full width -->
      <CommonPageHeader
        :title="apiData?.data?.[0]?.email"
        title-size="lg"
        show-background
        background-gradient="from-blue-500/6 via-indigo-400/4 to-transparent"
        padding-y="py-6"
      />

      <!-- Content - Limited width -->
      <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
        <UForm :state="form" @submit="saveUser">
          <FormEditorLazy
            ref="formEditorRef"
            v-model="form"
            v-model:errors="errors"
            v-model:has-changes="hasFormChanges"
            table-name="user_definition"
            :excluded="['isRootAdmin', 'isSystem']"
          />
        </UForm>
      </div>
    </div>

    <CommonEmptyState
      v-else
      title="User not found"
      description="The requested user could not be loaded"
      icon="lucide:user-x"
      size="sm"
    />
  </Transition>
</template>
