<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { createButtonLoader } = useButtonLoading();

const tableName = "user_definition";

const errors = ref<Record<string, string>>({});
const { validate, getIncludeFields } = useSchema(tableName);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-user",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    loading: computed(() => updateLoading.value),
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
    variant: "soft",
    color: "error",
    onClick: deleteUser,
    loading: computed(() => deleting.value),
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

// API composable for fetching user
const {
  data: apiData,
  pending: loading,
  execute: fetchUser,
} = useApiLazy(() => `/${tableName}`, {
  query: computed(() => ({
    fields: getIncludeFields(),
    filter: {
      id: { _eq: route.params.id },
    },
  })),
  errorContext: "Fetch User",
});

// User detail for display
const detail = ref<Record<string, any> | null>(null);
// Form data as ref
const form = ref<Record<string, any>>({});

// Watch API data and update refs
watch(
  apiData,
  (newData) => {
    if (newData?.data?.[0]) {
      const userData = newData.data[0];
      detail.value = userData;
      form.value = {
        ...userData,
        password: null, // to not display password
      };
    } else {
      detail.value = null;
      form.value = {};
    }
  },
  { immediate: true }
);

// API composable for updating user
const { pending: updateLoading, execute: updateUser } = useApiLazy(
  () => `/${tableName}/${form.value.id}`,
  {
    method: "patch",
    errorContext: "Update User",
  }
);

async function saveUser() {
  const payload = { ...form.value };
  if (!payload.password) delete payload.password; // to not overwrite with null
  const { isValid, errors: validationErrors } = validate(payload);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Error",
      description: "Please fill in all required fields.",
      color: "error",
    });
    return;
  }

  try {
    await updateUser({ body: payload });
    toast.add({ title: "Information saved", color: "primary" });
    errors.value = {};
  } finally {
  }
}

// API composable for deleting user
const { execute: removeUser, pending: deleting } = useApiLazy(
  () => `/${tableName}/${detail.value?.id}`,
  {
    method: "delete",
    errorContext: "Delete User",
  }
);

async function deleteUser() {
  const ok = await useConfirm().confirm({
    content: `Are you sure you want to delete user "${detail.value?.name}"?`,
  });
  if (!ok) return;

  const deleteLoader = createButtonLoader("delete-user");
  await deleteLoader.withLoading(async () => {
    await removeUser();
    toast.add({
      title: "User deleted",
      color: "success",
    });
    await navigateTo("/settings/users");
  });
}

async function fetchUserDetail(userId: string) {
  try {
    await fetchUser();

    if (!apiData.value?.data?.[0]) {
      toast.add({
        title: "User not found",
        description: "Invalid ID",
        color: "error",
      });
      router.push("/settings/users");
    }
  } catch (error) {
    // Error handled by useApiLazy
  }
}

onMounted(() => {
  fetchUserDetail(route.params.id as string);
});
watch(
  () => route.params.id,
  (newId) => fetchUserDetail(newId as string)
);
</script>

<template>
  <CommonLoadingState
    v-if="loading"
    title="Loading user..."
    description="Fetching user details"
    size="sm"
    type="form"
    context="page"
  />

  <UForm :state="form" @submit="saveUser" v-else-if="detail">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              v-if="detail.avatar"
              :src="detail.avatar"
              :alt="detail.name"
              size="xl"
            />
            <UAvatar v-else :alt="detail.name" size="xl">
              {{ detail.email?.charAt(0)?.toUpperCase() || "?" }}
            </UAvatar>
            <div>
              <div class="text-xl font-semibold">{{ detail.name }}</div>
              <div class="text-sm text-muted-foreground">
                {{ detail.email }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <FormEditor
        v-model="form"
        v-model:errors="errors"
        table-name="user_definition"
        :excluded="['id', 'isRootAdmin', 'isSystem']"
        class="mt-4"
      />
    </UCard>
  </UForm>

  <CommonEmptyState
    v-else
    title="User not found"
    description="The requested user could not be loaded"
    icon="lucide:user-x"
    size="sm"
  />
</template>
