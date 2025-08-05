<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { globalForm, globalFormLoading } = useGlobalState();
const { createButtonLoader } = useButtonLoading();

const tableName = "user_definition";

const user = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

async function fetchUser() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/${tableName}`, {
    query: {
      fields: getIncludeFields(),
      filter: {
        id: { _eq: route.params.id },
      },
    },
  });

  loading.value = false;

  const userData = data.value?.data?.[0];

  if (!userData) {
    toast.add({
      title: "User not found",
      description: error.value?.message || "Invalid ID",
      color: "error",
    });
    router.push("/users");
    return;
  }

  user.value = {
    ...userData,
    password: null, // to not display password
  };
}

async function saveUser() {
  const payload = { ...user.value };
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

  globalFormLoading.value = true;

  const { error } = await useApiLazy(`/${tableName}/${user.value.id}`, {
    method: "patch",
    body: payload,
  });

  globalFormLoading.value = false;

  if (error.value) {
    toast.add({
      title: "Error when saving",
      description: error.value.message,
      color: "error",
    });
    return;
  }

  toast.add({ title: "Information saved", color: "primary" });
  errors.value = {};
}

async function deleteUser() {
  const ok = await useConfirm().confirm({
    content: `Are you sure you want to delete user "${user.value.name}"?`,
  });
  if (!ok) return;

  const deleteLoader = createButtonLoader("delete-user");
  await deleteLoader.withLoading(async () => {
    const { error } = await useApiLazy(`/${tableName}/${user.value.id}`, {
      method: "delete",
    });

    if (error.value) {
      toast.add({
        title: "Error when deleting",
        description: error.value.message,
        color: "error",
      });
      return;
    }

    toast.add({
      title: "User deleted",
      color: "success",
    });
    await navigateTo("/settings/users");
  });
}

onMounted(fetchUser);
</script>

<template>
  <CommonLoadingState
    v-if="loading"
    title="Loading user..."
    description="Fetching user details"
    size="sm"
  />

  <UForm :state="user" ref="globalForm" @submit="saveUser" v-else-if="user">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UAvatar
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.name"
              size="xl"
            />
            <UAvatar v-else :alt="user.name" size="xl">
              {{ user.email?.charAt(0)?.toUpperCase() || "?" }}
            </UAvatar>
            <div>
              <div class="text-xl font-semibold">{{ user.name }}</div>
              <div class="text-sm text-muted-foreground">{{ user.email }}</div>
            </div>
          </div>

          <div>
            <UButton
              icon="lucide:trash"
              label="Delete user"
              color="error"
              variant="solid"
              :disabled="user.isSystem || user.isRootAdmin"
              :loading="createButtonLoader('delete-user').isLoading.value"
              @click="deleteUser"
            />
          </div>
        </div>
      </template>

      <FormEditor
        v-model="user"
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
