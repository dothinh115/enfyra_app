<script setup lang="ts">
const toast = useToast();
const setting = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);
const { globalForm, globalFormLoading } = useGlobalState();
const { generateEmptyForm, validate } = useSchema("setting_definition");

async function loadSetting() {
  loading.value = true;

  const { data, error } = await useApiLazy(`/setting_definition`, {
    query: {
      fields: "*",
      limit: 1,
    },
  });

  if (error.value) {
    toast.add({
      title: "Error loading configuration",
      description: error.value.message,
      color: "error",
    });
    loading.value = false;
    return;
  }

  const firstRecord = data.value?.data?.[0];
  setting.value = firstRecord || generateEmptyForm();

  loading.value = false;
}

async function saveSetting() {
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

  globalFormLoading.value = true;

  const { error } = await useApiLazy(
    `/setting_definition/${setting.value.id}`,
    {
      method: "patch",
      body: setting.value,
    }
  );

  if (error.value) {
    toast.add({
      title: "Error saving configuration",
      description: error.value.message,
      color: "error",
    });

    if (error.value.data?.errors) {
      errors.value = error.value.data.errors;
    }

    globalFormLoading.value = false;
    return;
  }

  toast.add({ title: "Configuration saved", color: "primary" });
  errors.value = {};
  globalFormLoading.value = false;
}

onMounted(loadSetting);
</script>

<template>
  <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-4">
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
    </div>
    <p class="text-sm text-muted-foreground">Loading settings...</p>
  </div>

  <UForm v-else @submit="saveSetting" ref="globalForm" :state="setting">
    <UCard :loading="globalFormLoading">
      <template #header>
        <div class="font-semibold text-base">System Configuration</div>
      </template>

      <DynamicFormEditor
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
