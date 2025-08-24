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
  <div class="max-w-[1000px] lg:max-w-[1000px] md:w-full">
    <!-- Header -->
    <CommonPageHeader
      title="General Settings"
      title-size="md"
      show-background
      background-gradient="from-teal-500/8 via-emerald-400/5 to-transparent"
      padding-y="py-6"
    />

    <Transition name="loading-fade" mode="out-in">
      <div v-if="!isMounted || loading">
        <CommonLoadingState
          title="Loading settings..."
          description="Fetching system configuration"
          size="sm"
          type="form"
          context="page"
        />
      </div>

      <div
        v-else
        class="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6"
      >
        <UForm @submit="handleSaveSetting" :state="setting">
          <FormEditorLazy
            table-name="setting_definition"
            mode="edit"
            v-model="setting"
            v-model:errors="errors"
          />
        </UForm>
      </div>
    </Transition>
  </div>
</template>
