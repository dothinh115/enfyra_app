<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();
const { validate } = useSchema("user_definition");

// Mounted state để đánh dấu first render
const isMounted = ref(false);

// API composable for fetching user
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

// Form data as ref
const form = ref<Record<string, any>>({});

// Computed user detail
const detail = computed(() => apiData.value?.data?.[0]);

// Form errors
const errors = ref<Record<string, string>>({});

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

// API composable for updating user
const { execute: updateUser, pending: updateLoading } = useApiLazy(
  () => `/user_definition/${route.params.id}`,
  {
    method: "patch",
    errorContext: "Update User",
  }
);

// API composable for deleting user
const { execute: removeUser, pending: deleteLoading } = useApiLazy(
  () => `/user_definition/${route.params.id}`,
  {
    method: "delete",
    errorContext: "Delete User",
  }
);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-user",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
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

  try {
    await updateUser({ body: form.value });
    toast.add({
      title: "Success",
      color: "success",
      description: "User updated!",
    });
    errors.value = {};
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

async function deleteUser() {
  const ok = await confirm({
    content: `Are you sure you want to delete user "${detail.value?.name}"?`,
  });
  if (!ok) return;

  try {
    await removeUser();
    toast.add({
      title: "User deleted",
      color: "success",
    });
    await navigateTo("/settings/users");
  } catch (error) {
    // Error already handled by useApiLazy
  }
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

onMounted(async () => {
  await fetchUserDetail(route.params.id as string);
  isMounted.value = true;
});

watch(
  () => route.params.id,
  (newId) => fetchUserDetail(newId as string)
);
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <!-- Loading State: khi chưa mounted hoặc đang loading -->
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading user..."
      description="Fetching user details"
      size="sm"
      type="form"
      context="page"
    />

    <!-- Form Content: khi có data -->
    <UForm v-else-if="detail" :state="form" @submit="saveUser">
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
          :excluded="['isRootAdmin', 'isSystem']"
          class="mt-4"
        />
      </UCard>
    </UForm>

    <!-- Empty State: khi đã mounted, không loading và không có data -->
    <CommonEmptyState
      v-else
      title="User not found"
      description="The requested user could not be loaded"
      icon="lucide:user-x"
      size="sm"
    />
  </Transition>
</template>
