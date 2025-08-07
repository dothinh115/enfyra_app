<template>
  <UForm class="mx-auto space-y-6" :state="form" @submit="handleCreate">
    <FormEditor
      v-model="form"
      v-model:errors="errors"
      :table-name="tableName"
    />
  </UForm>
</template>

<script setup lang="ts">
const toast = useToast();
const router = useRouter();

const tableName = "user_definition";

const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema(tableName);

// API composable for creating user
const {
  data: createData,
  pending: createLoading,
  execute: createUser,
} = useApiLazy(() => `/${tableName}`, {
  method: "post",
  errorContext: "Create User",
});

// Register header actions
useHeaderActionRegistry({
  id: "save-user",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  loading: computed(() => createLoading.value),
  submit: handleCreate,
  permission: {
    and: [
      {
        route: "/user_definition",
        actions: ["create"],
      },
    ],
  },
});

onMounted(() => {
  form.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors: validationErrors } = validate(form.value);
  errors.value = validationErrors;

  if (!isValid) {
    toast.add({
      title: "Invalid data",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  try {
    await createUser({ body: form.value });

    toast.add({
      title: "User created successfully",
      color: "success",
    });

    await router.push(`/settings/users/${createData.value?.data[0]?.id}`);
  } finally {
  }
}
</script>
