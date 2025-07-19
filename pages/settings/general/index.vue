<script setup lang="ts">
const toast = useToast();
const setting = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const { globalForm, globalFormLoading } = useGlobalState();
const { generateEmptyForm, validate } = useSchema("setting_definition");

async function loadSetting() {
  globalFormLoading.value = true;

  const { data, error } = await useApi(`/setting_definition`, {
    query: {
      fields: "*",
      limit: 1,
    },
  });

  if (error.value) {
    toast.add({
      title: "Lỗi khi tải cấu hình",
      description: error.value.message,
      color: "error",
    });
    globalFormLoading.value = false;
    return;
  }

  const firstRecord = data.value?.data?.[0];
  setting.value = firstRecord || generateEmptyForm();

  globalFormLoading.value = false;
}

async function saveSetting() {
  if (!setting.value) return;

  const { isValid, errors: validationErrors } = validate(setting.value);
  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Thiếu thông tin",
      description: "Vui lòng điền đầy đủ các trường bắt buộc.",
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
      title: "Lỗi khi lưu cấu hình",
      description: error.value.message,
      color: "error",
    });

    if (error.value.data?.errors) {
      errors.value = error.value.data.errors;
    }

    globalFormLoading.value = false;
    return;
  }

  toast.add({ title: "Đã lưu cấu hình", color: "primary" });
  errors.value = {};
  globalFormLoading.value = false;
}

onMounted(loadSetting);
</script>

<template>
  <UForm @submit="saveSetting" ref="globalForm" :state="setting">
    <UCard :loading="globalFormLoading">
      <template #header>
        <div class="font-semibold text-base">Cấu hình hệ thống</div>
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
