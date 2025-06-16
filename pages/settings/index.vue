<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast, useGlobalState } from "#imports";
import { UInput, UTextarea, USwitch } from "#components";
const toast = useToast();
const saving = ref(false);
const newPermission = ref("");

const { settings, tables } = useGlobalState();

// Lấy bảng setting_definition
const settingTable = computed(() =>
  tables.value.find((t) => t.name === "setting_definition")
);

// Map từ tên cột sang full column info
const columnInfoMap = computed(() => {
  const map = new Map<string, any>();
  for (const col of settingTable.value?.columns || []) {
    map.set(col.name, col);
  }
  return map;
});

function getComponentConfigByKey(key: string) {
  const column = columnInfoMap.value.get(key);
  const type = column?.type;

  if (!column) return { component: UInput, props: {} };

  if (type === "boolean") {
    return {
      component: USwitch,
      props: {
        label: column.description || key,
      },
    };
  }

  if (["text"].includes(type)) {
    return {
      component: UTextarea,
      props: {
        autoresize: true,
        placeholder: `Nhập ${column.description || key}`,
        rows: 4,
      },
    };
  }

  return {
    component: UInput,
    props: {
      placeholder: `Nhập ${column.description || key}`,
      type: type === "int" ? "number" : "text",
      class: "w-full",
    },
  };
}

// Các key mặc định không render lại
const systemKeys = [
  "id",
  "projectName",
  "projectUrl",
  "projectDescription",
  "actionPermissionValue",
  "isInit",
  "isSystem",
  "createdAt",
  "updatedAt",
];

// Lấy các field tuỳ chỉnh
const customFields = computed(() => {
  return Object.entries(settings.value).filter(
    ([key]) => !systemKeys.includes(key)
  );
});

// Thêm quyền mới
function addPermission(method: string, action: string) {
  if (method && action) {
    settings.value.actionPermissionValue[method] = action;
  }
}

function removePermission(method: string) {
  delete settings.value.actionPermissionValue[method];
}

// Lưu setting
async function saveSetting() {
  saving.value = true;
  try {
    await useApi(`/setting_definition/${settings.value.id}`, {
      method: "patch",
      body: settings.value,
    });
    toast.add({ title: "Đã lưu cấu hình", color: "primary" });
  } catch (e: any) {
    toast.add({ title: "Lỗi khi lưu", description: e.message, color: "error" });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-12">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold">Cài đặt hệ thống</h1>
      <p class="text-muted-foreground text-sm">
        Tuỳ chỉnh các thông số mặc định cho hệ thống.
      </p>
    </div>

    <!-- Thông tin hệ thống -->
    <UCard>
      <template #header>
        <div class="font-semibold text-base">Thông tin hệ thống</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UFormField label="Tên hệ thống">
          <UInput
            v-model="settings.projectName"
            placeholder="Tên hệ thống"
            class="w-full"
          />
        </UFormField>

        <UFormField label="URL hệ thống">
          <UInput
            v-model="settings.projectUrl"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField label="Mô tả" class="md:col-span-2">
          <UTextarea
            v-model="settings.projectDescription"
            placeholder="Mô tả hệ thống"
            autoresize
            class="w-full"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Mapping quyền API -->
    <UCard>
      <template #header>
        <div class="font-semibold text-base">Mapping quyền API</div>
      </template>

      <div class="space-y-4">
        <div
          v-for="(action, method) in settings.actionPermissionValue"
          :key="method"
          class="flex items-center gap-4"
        >
          <UBadge variant="solid" color="primary">{{ method }}</UBadge>
          <UInput
            v-model="settings.actionPermissionValue[method]"
            placeholder="Hành động (vd: read)"
          />
          <UButton
            icon="lucide:trash"
            size="xs"
            color="error"
            variant="ghost"
            @click="removePermission(method as any)"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <UInput v-model="newPermission" placeholder="PUT:sync" />
          <UButton
            icon="lucide:plus"
            @click="
              () => {
                if (newPermission.includes(':')) {
                  const [method, action] = newPermission.split(':');
                  if (method && action) {
                    addPermission(method.trim().toUpperCase(), action.trim());
                    newPermission = '';
                  }
                } else {
                  toast.add({
                    title: 'Định dạng không hợp lệ',
                    description:
                      'Vui lòng nhập theo định dạng METHOD:action (vd: PUT:sync)',
                    color: 'warning',
                  });
                }
              }
            "
          />
        </div>
      </div>
    </UCard>

    <!-- Cấu hình tuỳ chỉnh -->
    <UCard v-if="customFields.length">
      <template #header>
        <div class="font-semibold text-base">Cấu hình tuỳ chỉnh</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="[key, value] in customFields" :key="key">
          <UFormField
            :label="key"
            :description="columnInfoMap.get(key)?.description"
          >
            <component
              :is="getComponentConfigByKey(key).component"
              v-bind="getComponentConfigByKey(key).props"
              v-model="settings[key]"
            />
          </UFormField>
        </div>
      </div>
    </UCard>

    <!-- Cấu hình nâng cao -->
    <UCard>
      <template #header>
        <div class="font-semibold text-base">Cấu hình nâng cao</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <USwitch v-model="settings.isInit" label="Khởi tạo lần đầu (isInit)" />
      </div>
    </UCard>

    <!-- Nút lưu -->
    <div class="flex justify-end">
      <UButton
        icon="lucide:save"
        label="Lưu cấu hình"
        :loading="saving"
        @click="saveSetting"
      />
    </div>
  </div>
</template>
