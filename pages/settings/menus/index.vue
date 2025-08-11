<script setup lang="ts">
import { useLoader } from "~/composables/useLoader";
import { useMenuRegistry } from "~/composables/useMenuRegistry";
import { useMenuApi } from "~/composables/useMenuApi";

const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "menu_definition";
const { getIncludeFields } = useSchema(tableName);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const menus = ref<any[]>([]);
const { schemas } = useGlobalState();
const { createLoader } = useLoader();
console.log(schemas.value);

// Filter state
const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

// Filter button computed values
const filterLabel = computed(() => {
  const activeCount = currentFilter.value.conditions.length;
  return activeCount > 0 ? `Filters (${activeCount})` : "Filter";
});

const filterVariant = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "solid" : "outline";
});

const filterColor = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "secondary" : "neutral";
});

// API composable for fetching menus
const {
  data: apiData,
  pending: loading,
  execute: fetchMenus,
} = useApiLazy(() => "/menu_definition", {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      fields: getIncludeFields(),
      sort: "order",
      meta: "*",
      page: page.value,
      limit: pageLimit,
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
  errorContext: "Fetch Menus",
});

// Computed values from API data
const menusData = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Register header actions
useHeaderActionRegistry([
  {
    id: "filter-menus",
    icon: "lucide:filter",
    get label() {
      return filterLabel.value;
    },
    get variant() {
      return filterVariant.value;
    },
    get color() {
      return filterColor.value;
    },
    size: "md",
    onClick: () => {
      showFilterDrawer.value = true;
    },
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["read"],
        },
      ],
    },
  },
  {
    id: "create-menu",
    label: "Create Menu",
    icon: "lucide:plus",
    variant: "solid",
    color: "primary",
    size: "md",
    to: "/settings/menus/create",
    permission: {
      and: [
        {
          route: "/menu_definition",
          actions: ["create"],
        },
      ],
    },
  },
]);

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

// Create loaders for each menu toggle button
const menuLoaders = ref<Record<string, any>>({});

function getMenuLoader(menuId: string) {
  if (!menuLoaders.value[menuId]) {
    menuLoaders.value[menuId] = createLoader();
  }
  return menuLoaders.value[menuId];
}

// Apply filters - called by FilterDrawer
async function applyFilters() {
  page.value = 1;
  await fetchMenus();
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
  applyFilters();
}

async function toggleEnabled(menuItem: any) {
  const loader = getMenuLoader(menuItem.id);
  const newEnabled = !menuItem.isEnabled;

  // Optimistic update - change UI immediately
  // Update directly in apiData to trigger reactivity
  if (apiData.value?.data) {
    const menuIndex = apiData.value.data.findIndex(
      (m: any) => m.id === menuItem.id
    );
    if (menuIndex !== -1) {
      apiData.value.data[menuIndex].isEnabled = newEnabled;
    }
  }

  try {
    // Create a specific instance for this menu update
    const { execute: updateSpecificMenu } = useApiLazy(
      () => `/menu_definition/${menuItem.id}`,
      {
        method: "patch",
        errorContext: "Toggle Menu",
      }
    );

    await loader.withLoading(() =>
      updateSpecificMenu({ body: { isEnabled: newEnabled } })
    );

    // Reregister all menus after successful update
    const { reregisterAllMenus } = useMenuRegistry();
    const { fetchMenuDefinitions } = useMenuApi();
    await reregisterAllMenus(fetchMenuDefinitions as any);

    toast.add({
      title: "Success",
      description: `Menu ${newEnabled ? "enabled" : "disabled"} successfully`,
      color: "success",
    });
  } catch (error) {
    // Revert optimistic update on error
    if (apiData.value?.data) {
      const menuIndex = apiData.value.data.findIndex(
        (m: any) => m.id === menuItem.id
      );
      if (menuIndex !== -1) {
        apiData.value.data[menuIndex].isEnabled = !newEnabled;
      }
    }

    toast.add({
      title: "Error",
      description: "Failed to update menu status",
      color: "error",
    });
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
                  :disabled="getMenuLoader(menu.id).isLoading"
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

    <div
      v-else-if="!loading && menus.length === 0"
      class="flex flex-col items-center justify-center py-16"
    >
      <UIcon
        name="i-heroicons-bars-3"
        class="text-gray-400 mx-auto text-8xl mb-6"
      />
      <div class="text-center">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          No menus found
        </h3>
        <p
          class="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto"
        >
          No menu configurations have been created yet. Create your first menu
          to start building the navigation structure.
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        to="/settings/menus/create"
        size="lg"
        variant="solid"
        color="primary"
        class="shadow-lg hover:shadow-xl transition-all duration-200"
      >
        Create First Menu
      </UButton>
    </div>
  </div>

  <!-- Filter Drawer -->
  <FilterDrawer
    v-model="showFilterDrawer"
    v-model:filter-value="currentFilter"
    :table-name="tableName"
    @apply="applyFilters"
    @clear="clearFilters"
  />
</template>
