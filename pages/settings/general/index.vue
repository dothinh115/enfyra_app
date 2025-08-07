<script setup lang="ts">
const toast = useToast();
const errors = ref<Record<string, string>>({});

const { generateEmptyForm, validate } = useSchema("setting_definition");

// Register header actions
useHeaderActionRegistry({
  id: "save-general",
  label: "Save",
  icon: "lucide:save",
  variant: "solid",
  color: "primary",
  submit: handleSaveSetting,
});

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
const { execute: saveSetting } = useApiLazy(
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

onMounted(() => loadSetting());
</script>

<template>
  <CommonLoadingState
    v-if="loading"
    title="Loading settings..."
    description="Fetching system configuration"
    size="sm"
    type="form"
    context="page"
  />

  <UForm v-else @submit="handleSaveSetting"  :state="setting">
    <UCard>
      <template #header>
        <div class="font-semibold text-base">System Configuration</div>
      </template>

      <FormEditor
        v-model="setting"
        table-name="setting_definition"
        v-model:errors="errors"
        :excluded="['id', 'isInit', 'isSystem']"
        :type-map="{
          methods: {
            componentProps: {
              disabled: true,
            },
          },
        }"
      />
    </UCard>
  </UForm>
</template>
