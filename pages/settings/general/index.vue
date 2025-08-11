<script setup lang="ts">
const toast = useToast();
const errors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema("setting_definition");

// Mounted state để đánh dấu first render
const isMounted = ref(false);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-settings",
    label: "Save",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    submit: handleSaveSetting,
    loading: computed(() => saveLoading.value),
    permission: {
      and: [
        {
          route: "/setting",
          actions: ["update"],
        },
      ],
    },
  },
]);

// API composable for loading settings
const {
  data: apiData,
  pending: loading,
  execute: loadSetting,
} = useApiLazy(() => `/setting_definition`, {
  query: {
    fields: "*",
    limit: 1,
  },
  errorContext: "Load Settings",
});

// Form data as ref
const setting = ref<Record<string, any>>({});

// Watch API data and update form
watch(
  apiData,
  (newData) => {
    const firstRecord = newData?.data?.[0];
    setting.value = firstRecord || generateEmptyForm();
  },
  { immediate: true }
);

// API composable for saving settings
const { execute: saveSetting, pending: saveLoading } = useApiLazy(
  () => `/setting_definition/${setting.value.id}`,
  {
    method: "patch",
    errorContext: "Save Settings",
  }
);

async function handleSaveSetting() {
  if (!setting.value) return;

  const { isValid, errors: validationErrors } = validate(setting.value);
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
    await saveSetting({ body: setting.value });
    toast.add({ title: "Configuration saved", color: "primary" });
    errors.value = {};
  } finally {
  }
}

onMounted(async () => {
  await loadSetting();
  isMounted.value = true;
});
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <!-- Loading State: khi chưa mounted hoặc đang loading -->
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading settings..."
      description="Fetching system configuration"
      size="sm"
      type="form"
      context="page"
    />

    <!-- Form Content: khi đã mounted và không loading -->
    <UForm v-else @submit="handleSaveSetting" :state="setting">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">General Settings</div>
        </template>

        <template #default>
          <FormEditor
            table-name="setting_definition"
            mode="edit"
            v-model="setting"
            v-model:errors="errors"
          />
        </template>
      </UCard>
    </UForm>
  </Transition>
</template>
