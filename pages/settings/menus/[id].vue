<script setup lang="ts">
const route = useRoute();

const toast = useToast();
const { confirm } = useConfirm();

const tableName = "menu_definition";

// Mounted state để đánh dấu first render
const isMounted = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

// Menu registry composables for reregistering after changes
const { fetchMenuDefinitions } = useMenuApi();
const { reregisterAllMenus, registerTableMenusWithSidebarIds } =
  useMenuRegistry();
const { tables } = useGlobalState();

// API composable for fetching menu detail
const {
  data: menuData,
  pending: loading,
  execute: executeFetchMenu,
} = useApiLazy(() => `/${tableName}`, {
  query: {
    fields: getIncludeFields(),
    filter: { id: { _eq: Number(route.params.id) } },
  },
  errorContext: "Fetch Menu",
});

// API composable for updating menu
const {
  execute: executeUpdateMenu,
  pending: updateLoading,
  error: updateError,
} = useApiLazy(() => `/${tableName}`, {
  method: "patch",
  errorContext: "Update Menu",
});

// API composable for deleting menu
const { execute: executeDeleteMenu, pending: deleteLoading } = useApiLazy(
  () => `/${tableName}`,
  {
    method: "delete",
    errorContext: "Delete Menu",
  }
);

// Computed menu detail
const detail = computed(() => menuData.value?.data?.[0]);

// Form data as ref
const form = ref<Record<string, any>>({});

// Form errors
const errors = ref<Record<string, string>>({});

// Watch API data and update form
watch(
  menuData,
  (newData) => {
    if (newData?.data?.[0]) {
      form.value = { ...newData.data[0] };
    }
  },
  { immediate: true }
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

async function updateMenuDetail() {
  if (!form.value) return;

  const { isValid, errors: validationErrors } = validate(form.value);
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
    await executeUpdateMenu({ id: Number(route.params.id), body: form.value });

    // Reregister menus after update
    await fetchMenuDefinitions();
    await reregisterAllMenus(fetchMenuDefinitions as any);

    toast.add({
      title: "Success",
      color: "success",
      description: "Menu updated!",
    });
    errors.value = {};
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

async function deleteMenuDetail() {
  const ok = await confirm({
    title: "Are you sure?",
    content: "This action cannot be undone.",
  });
  if (!ok) return;

  try {
    await executeDeleteMenu({ id: Number(route.params.id) });

    // Reregister menus after delete
    await fetchMenuDefinitions();
    await reregisterAllMenus(fetchMenuDefinitions as any);

    toast.add({ title: "Menu deleted", color: "success" });
    await navigateTo("/settings/menus");
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

onMounted(async () => {
  await executeFetchMenu();
  isMounted.value = true;
});
</script>

<template>
  <Transition name="loading-fade" mode="out-in">
    <!-- Loading State: khi chưa mounted hoặc đang loading -->
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading menu..."
      description="Fetching menu details"
      size="sm"
      type="form"
      context="page"
    />

    <!-- Form Content: khi có data -->
    <div v-else-if="detail" class="space-y-6">
      <div class="flex items-center gap-3">
        <Icon
          :name="detail.icon || 'lucide:circle'"
          class="text-2xl text-primary"
        />
        <div class="text-xl font-bold text-primary">
          Menu: {{ detail.name }}
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <UBadge color="primary" v-if="detail.isSystem"
                >System Menu</UBadge
              >
              <UBadge color="secondary" v-if="detail.isEnabled">Enabled</UBadge>
            </div>
          </div>
        </template>

        <FormEditor
          v-model="form"
          v-model:errors="errors"
          :table-name="tableName"
          :excluded="['isSystem', 'createdAt', 'updatedAt']"
        />
      </UCard>
    </div>

    <!-- Empty State: khi đã mounted, không loading và không có data -->
    <CommonEmptyState
      v-else
      title="Menu not found"
      description="The requested menu could not be loaded"
      icon="lucide:menu"
      size="sm"
    />
  </Transition>
</template>
