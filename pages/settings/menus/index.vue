<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "menu_definition";
const { getIncludeFields } = useSchema(tableName);
const menus = ref<any[]>([]);

// API composable for fetching menus
const {
  data: apiData,
  pending: loading,
  execute: fetchMenus,
} = useApiLazy(() => "/menu_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "order",
    meta: "*",
    page: page.value,
    limit: pageLimit,
  })),
  errorContext: "Fetch Menus",
});

// Computed values from API data
const menusData = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Register header actions
useHeaderActionRegistry({
  id: "create-menu",
  label: "Create Menu",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  to: "/settings/menus/create",
  class: "rounded-full",
  permission: {
    and: [
      {
        route: "/menu_definition",
        actions: ["create"],
      },
    ],
  },
});

// Update menus when data changes
watch(
  menusData,
  (newMenus) => {
    menus.value = newMenus;
  },
  { immediate: true }
);

// Watch for page changes in URL
watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchMenus();
  },
  { immediate: true }
);

async function toggleEnabled(menuItem: any) {
  const newEnabled = !menuItem.isEnabled;

  // Create a specific instance for this menu update
  const { execute: updateSpecificMenu } = useApiLazy(
    () => `/menu_definition/${menuItem.id}`,
    {
      method: "patch",
      errorContext: "Toggle Menu",
    }
  );

  try {
    await updateSpecificMenu({ body: { isEnabled: newEnabled } });
    // If successful, update the local state
    const index = menus.value.findIndex((m) => m.id === menuItem.id);
    if (index !== -1) {
      menus.value[index] = { ...menus.value[index], isEnabled: newEnabled };
    }
  } catch (error) {
    // Error will be handled by useApiLazy (including 403 redirect)
    // No need to revert since we didn't change the original object
  }
}
</script>

<template>
  <div class="space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading menus..."
      description="Fetching menu configuration"
      size="sm"
      type="card"
      context="page"
    />

    <div v-else-if="menus.length" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ULink
          :to="`/settings/menus/${menu.id}`"
          v-for="menu in menus"
          :key="menu.id"
          class="cursor-pointer relative z-10"
        >
          <UCard
            class="h-full hover:bg-gray-50 dark:hover:bg-gray-800 transition hover:shadow-md"
            variant="subtle"
          >
            <div class="flex flex-col h-full gap-3">
              <div class="flex items-center gap-3">
                <Icon
                  :name="menu.icon || 'lucide:circle'"
                  class="text-xl text-primary mt-1"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-primary truncate">
                    {{ menu.path }}
                  </div>
                  <div class="text-sm text-gray-500 truncate">
                    {{ menu.label }}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  :color="menu.type === 'mini' ? 'primary' : 'secondary'"
                  size="xs"
                >
                  {{ menu.type === "mini" ? "Sidebar" : "Menu Item" }}
                </UBadge>
                <UBadge
                  :color="menu.isEnabled ? 'success' : 'warning'"
                  size="xs"
                >
                  {{ menu.isEnabled ? "Enabled" : "Disabled" }}
                </UBadge>
                <UBadge v-if="menu.isSystem" color="info" size="xs">
                  System
                </UBadge>
              </div>

              <div class="flex items-center justify-between mt-auto">
                <div class="text-xs text-gray-400">Order: {{ menu.order }}</div>
                <USwitch
                  :model-value="menu.isEnabled"
                  @update:model-value="toggleEnabled(menu)"
                  label="Is enabled"
                  @click.prevent
                  v-if="!menu.isSystem"
                />
              </div>
            </div>
          </UCard>
        </ULink>
      </div>

      <!-- Pagination - chỉ hiện khi có nhiều trang -->
      <div class="flex justify-center mt-6" v-if="total > pageLimit">
        <UPagination
          v-model:page="page"
          :items-per-page="pageLimit"
          :total="total"
          show-edges
          :sibling-count="1"
          :to="
            (p) => ({
              path: route.path,
              query: { ...route.query, page: p },
            })
          "
          color="secondary"
          active-color="secondary"
        />
      </div>
    </div>

    <CommonEmptyState
      v-else-if="!loading"
      title="No menus found"
      description="No menu configurations have been created yet"
      icon="lucide:menu"
      size="sm"
    />
  </div>
</template>
