<script setup lang="ts">
import { UInput, UTextarea, USwitch } from "#components";

const toast = useToast();
const newPermission = ref("");

const { settings, tables, globalForm, globalFormLoading } = useGlobalState();
const { confirm } = useConfirm();

const settingTable = computed(() =>
  tables.value.find((t) => t.name === "setting_definition")
);

const columnInfoMap = computed(() => {
  const map = new Map<string, any>();
  for (const col of settingTable.value?.columns || []) {
    map.set(col.name, col);
  }
  return map;
});

const systemKeys = ["id", "createdAt", "updatedAt", "isSystem"];

const manualKeys = ["actionPermissionValue"];

const formFields = computed(() => {
  return Object.entries(settings.value).filter(
    ([key]) => !systemKeys.includes(key) && !manualKeys.includes(key)
  );
});

function getComponentConfigByKey(key: string) {
  const column = columnInfoMap.value.get(key);
  const type = column?.type;

  const fieldProps = {
    class: "min-h-[110px]",
  };

  if (!column) {
    return {
      component: UInput,
      componentProps: {},
      fieldProps,
    };
  }

  if (type === "boolean") {
    return {
      component: USwitch,
      componentProps: {
        label: column.description || key,
      },
      fieldProps,
    };
  }

  if (type === "text") {
    return {
      component: UTextarea,
      componentProps: {
        autoresize: true,
        placeholder: column.placeholder || key,
        rows: 4,
        class: "w-full",
      },
      fieldProps: {
        class: "col-span-2",
      },
    };
  }

  return {
    component: UInput,
    componentProps: {
      placeholder: column.placeholder || key,
      type: type === "int" ? "number" : "text",
      class: "w-full",
    },
    fieldProps,
  };
}

// Quyền
function addPermission(method: string, action: string) {
  if (method && action) {
    settings.value.actionPermissionValue[method] = action;
  }
}

function removePermission(method: string) {
  delete settings.value.actionPermissionValue[method];
}

// Lưu
async function saveSetting() {
  globalFormLoading.value = true;
  const ok = await confirm({
    content: "Update settings?",
  });
  if (!ok) {
    globalFormLoading.value = false;
    return;
  }
  try {
    await useApi(`/setting_definition/${settings.value.id}`, {
      method: "patch",
      body: settings.value,
    });
    toast.add({ title: "Đã lưu cấu hình", color: "primary" });
  } catch (e: any) {
    toast.add({ title: "Lỗi khi lưu", description: e.message, color: "error" });
  } finally {
    globalFormLoading.value = false;
  }
}

const booleanFields = computed(() =>
  Object.entries(settings.value).filter(
    ([key]) =>
      !systemKeys.includes(key) &&
      !manualKeys.includes(key) &&
      columnInfoMap.value.get(key)?.type === "boolean"
  )
);

const normalFields = computed(() =>
  Object.entries(settings.value).filter(
    ([key]) =>
      !systemKeys.includes(key) &&
      !manualKeys.includes(key) &&
      columnInfoMap.value.get(key)?.type !== "boolean"
  )
);
</script>

<template>
  <UForm
    :state="settings"
    ref="globalForm"
    @submit="saveSetting"
    class="space-y-12"
  >
    <!-- Các trường dạng text / input -->
    <UCard v-if="normalFields.length">
      <template #header>
        <div class="font-semibold text-base">Cấu hình thông tin</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UFormField
          :label="key"
          v-bind="getComponentConfigByKey(key).fieldProps"
          v-for="[key] in normalFields"
          :key="key"
        >
          <template #description>
            <span
              class="block min-h-[1.25rem] text-xs text-muted-foreground italic"
            >
              {{ columnInfoMap.get(key)?.description || "" }}
            </span>
          </template>

          <component
            :is="getComponentConfigByKey(key).component"
            v-bind="getComponentConfigByKey(key).componentProps"
            v-model="settings[key]"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Các trường boolean gom riêng -->
    <UCard v-if="booleanFields.length">
      <template #header>
        <div class="font-semibold text-base">Cấu hình công tắc (boolean)</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <USwitch
          v-for="[key] in booleanFields"
          :key="key"
          v-model="settings[key]"
          :label="columnInfoMap.get(key)?.name || key"
        />
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
                  addPermission(method.trim().toUpperCase(), action.trim());
                  newPermission = '';
                } else {
                  toast.add({
                    title: 'Định dạng không hợp lệ',
                    description: 'PUT:sync',
                    color: 'warning',
                  });
                }
              }
            "
          />
        </div>
      </div>
    </UCard>
  </UForm>
</template>
