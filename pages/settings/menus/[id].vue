<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const tableName = "menu_definition";
const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

const { validate, getIncludeFields } = useSchema(tableName);

// Menu registry composables for reregistering after changes
const { fetchMenuDefinitions } = useMenuApi();
const { reregisterAllMenus, registerTableMenusWithSidebarIds } =
  useMenuRegistry();
const { tables } = useGlobalState();

// API composable for fetching menu detail
const {
  data: menuData,
  error: fetchError,
  execute: executeFetchMenu,
  pending: fetchPending,
} = useApiLazy(() => "/menu_definition", {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: Number(route.params.id) } },
  },
});

// API composable for updating menu
const { execute: executeUpdateMenu, pending: updateLoading } = useApiLazy(
  () => `/menu_definition/${detail.value?.id}`,
  {
    method: "patch",
  }
);

// API composable for deleting menu
const { execute: executeDeleteMenu, pending: deleteLoading } = useApiLazy(
  () => `/menu_definition/${route.params.id}`,
  {
    method: "delete",
  }
);

// Register header actions
useHeaderActionRegistry([
  {
    id: "save-menu",
    label: "Save Changes",
    icon: "lucide:save",
    variant: "solid",
    color: "primary",
    size: "md",
    loading: updateLoading,
    disabled: computed(() => detail.value?.isSystem || false),
    onClick: updateMenuDetail,
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["update"],
        },
      ],
    },
  },
  {
    id: "delete-menu",
    label: "Delete",
    icon: "lucide:trash",
    variant: "solid",
    color: "error",
    size: "md",
    onClick: deleteMenuDetail,
    loading: deleteLoading,
    disabled: computed(() => detail.value?.isSystem || false),
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["delete"],
        },
      ],
    },
  },
]);

async function fetchMenuDetail(menuId: number) {
  await executeFetchMenu();

  if (!menuData.value?.data?.[0]) {
    router.replace("/settings/menus");
    return;
  }

  detail.value = menuData.value.data[0];
  form.value = { ...detail.value };
  errors.value = {};
}

async function updateMenuDetail() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    return;
  }

  await executeUpdateMenu({ body: form.value });

  // Reregister all menus after update
  await reregisterAllMenus(fetchMenuDefinitions);

  // Also reregister table menus to ensure consistency
  if (tables.value.length > 0) {
    await registerTableMenusWithSidebarIds(tables.value);
  }
}

async function deleteMenuDetail() {
  const ok = await confirm({ title: "Are you sure?" });
  if (!ok || detail.value?.isSystem) return;

  await executeDeleteMenu();

  // Reregister all menus after delete
  await reregisterAllMenus(fetchMenuDefinitions);

  // Also reregister table menus to ensure consistency
  if (tables.value.length > 0) {
    await registerTableMenusWithSidebarIds(tables.value);
  }

  router.push("/settings/menus");
}

onMounted(() => fetchMenuDetail(Number(route.params.id)));
watch(
  () => route.params.id,
  (newVal) => fetchMenuDetail(Number(newVal))
);
</script>

<template>
  <!-- Loading state -->
  <div
    v-if="fetchPending"
    class="flex flex-col items-center justify-center py-20 gap-4"
  >
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div
        class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"
      ></div>
    </div>
    <p class="text-sm text-muted-foreground">Loading menu...</p>
  </div>

  <!-- Form content -->
  <UForm
    v-else-if="detail"
    :state="form"
    @submit="updateMenuDetail"
    class="space-y-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon
          :name="detail.icon || 'lucide:menu'"
          class="text-2xl text-primary"
        />
        <div class="text-xl font-bold text-primary">
          Menu: {{ detail.label }}
        </div>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UBadge color="primary" v-if="form.isSystem">System Menu</UBadge>
            <UBadge color="secondary" v-if="form.isEnabled">Enabled</UBadge>
            <UBadge
              :color="form.type === 'mini' ? 'primary' : 'secondary'"
              v-if="form.type"
            >
              {{ form.type === "mini" ? "Sidebar" : "Menu Item" }}
            </UBadge>
          </div>
        </div>
      </template>

      <FormEditor
        v-model="form"
        v-model:errors="errors"
        :table-name="tableName"
        :excluded="['isSystem']"
        :type-map="{
          order: {
            componentProps: {
              min: 0,
              step: 1,
            },
          },
          permission: {
            height: '100px',
          },
          path: { disabled: detail?.isSystem },
          isEnabled: { disabled: detail?.isSystem },
        }"
      />
    </UCard>
  </UForm>
</template>
