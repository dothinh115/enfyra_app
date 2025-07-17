<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "#imports";

const toast = useToast();
const loading = ref(false);
const setting = ref<any>(null);
const errors = ref<Record<string, string>>({});

async function loadSetting() {
  loading.value = true;
  const { data, error } = await useApiLazy("/setting_definition");
  if (error.value) {
    toast.add({
      title: "Lỗi khi tải cấu hình",
      description: error.value.message,
      color: "error",
    });
  } else {
    setting.value = data.value.data[0];
  }
  loading.value = false;
}

async function saveSetting() {
  loading.value = true;
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
    // Nếu response có validation lỗi dạng { errors: { field: message } }, gán vào errors:
    if (error.value.data?.errors) {
      errors.value = error.value.data.errors;
    }
  } else {
    toast.add({ title: "Đã lưu cấu hình", color: "primary" });
    errors.value = {};
  }

  loading.value = false;
}

onMounted(loadSetting);
</script>

<template>
  <UCard v-if="setting" :loading="loading">
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
</template>
