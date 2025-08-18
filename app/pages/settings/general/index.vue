<script setup lang="ts">
const toast = useToast();
const errors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema("setting_definition");

const { isMounted } = useMounted();

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

const setting = ref<Record<string, any>>({});

watch(
  apiData,
  (newData) => {
    const firstRecord = newData?.data?.[0];
    setting.value = firstRecord || generateEmptyForm();
  },
  { immediate: true }
);

const {
  execute: saveSetting,
  pending: saveLoading,
  error: saveError,
} = useApiLazy(() => `/setting_definition/${setting.value.id}`, {
  method: "patch",
  errorContext: "Save Settings",
});

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

  await saveSetting({ body: setting.value });

  // Check if there was an error
  if (saveError.value) {
    return;
  }

  toast.add({ title: "Configuration saved", color: "primary" });
  errors.value = {};
}

onMounted(async () => {
  await loadSetting();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-300">General Settings</h1>
    </div>

    <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading settings..."
      description="Fetching system configuration"
      size="sm"
      type="form"
      context="page"
    />

    <UForm v-else @submit="handleSaveSetting" :state="setting">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">General Settings</div>
        </template>

        <template #default>
          <FormEditorLazy
            table-name="setting_definition"
            mode="edit"
            v-model="setting"
            v-model:errors="errors"
          />
        </template>
      </UCard>
    </UForm>
  </Transition>
  </div>
</template>
