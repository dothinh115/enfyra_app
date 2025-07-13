<script setup lang="ts">
import { ref } from "vue";

const toast = useToast();
const loading = ref(false);
const setting = ref<any>(null);

async function loadSetting() {
  loading.value = true;
  try {
    const { data } = await useApiLazy("/setting_definition");
    setting.value = data.value.data[0];
  } catch (e: any) {
    toast.add({
      title: "Lỗi khi tải cấu hình",
      description: e.message,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

async function saveSetting() {
  loading.value = true;
  try {
    await useApiLazy(`/setting_definition/${setting.value.id}`, {
      method: "patch",
      body: setting.value,
    });
    toast.add({ title: "Đã lưu cấu hình", color: "primary" });
  } catch (e: any) {
    toast.add({
      title: "Lỗi khi lưu cấu hình",
      description: e.message,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadSetting();
});
</script>

<template>
  <UCard v-if="setting" :loading="loading">
    <template #header>
      <div class="font-semibold text-base">Cấu hình hệ thống</div>
    </template>

    <DynamicFormEditor
      v-model="setting"
      table-name="setting_definition"
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
