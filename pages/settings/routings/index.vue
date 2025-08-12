<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 15;
const route = useRoute();
const tableName = "route_definition";
const { getIncludeFields } = useSchema(tableName);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createLoader } = useLoader();
const { isTablet } = useScreen();
const routes = ref<any[]>([]);

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

// API composable for fetching routes
const {
  data: apiData,
  pending: loading,
  execute: fetchRoutes,
} = useApiLazy(() => "/route_definition", {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      fields: getIncludeFields(),
      sort: "-createdAt",
      meta: "*",
      page: page.value,
      limit: pageLimit,
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
  errorContext: "Fetch Routes",
});

// Computed values from API data
const routesData = computed(() => apiData.value?.data || []);
const total = computed(() => {
  // Use filterCount when there are active filters, otherwise use totalCount
  const hasFilters = hasActiveFilters(currentFilter.value);
  return hasFilters
    ? apiData.value?.meta?.filterCount || apiData.value?.meta?.totalCount || 0
    : apiData.value?.meta?.totalCount || 0;
});

// Register header actions
useHeaderActionRegistry([
  {
    id: "filter-routings",
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
          route: "/route_definition",
          actions: ["read"],
        },
      ],
    },
  },
  {
    id: "create-routing",
    label: "Create Route",
    icon: "lucide:plus",
    variant: "solid",
    color: "primary",
    size: "md",
    to: "/settings/routings/create",
    permission: {
      and: [
        {
          route: "/route_definition",
          actions: ["create"],
        },
      ],
    },
  },
]);

// Update routes when data changes
watch(
  routesData,
  (newRoutes) => {
    routes.value = newRoutes;
  },
  { immediate: true }
);

// Apply filters - called by FilterDrawer
async function applyFilters() {
  page.value = 1;
  await fetchRoutes();
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
  applyFilters();
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRoutes();
  },
  { immediate: true }
);

// Create loaders for each route toggle button
const routeLoaders = ref<Record<string, any>>({});

function getRouteLoader(routeId: string) {
  if (!routeLoaders.value[routeId]) {
    routeLoaders.value[routeId] = createLoader();
  }
  return routeLoaders.value[routeId];
}

async function toggleEnabled(routeItem: any) {
  const loader = getRouteLoader(routeItem.id);

  // Optimistic update - change UI immediately
  const newEnabled = !routeItem.isEnabled;

  // Update directly in apiData to trigger reactivity
  if (apiData.value?.data) {
    const routeIndex = apiData.value.data.findIndex(
      (r: any) => r.id === routeItem.id
    );
    if (routeIndex !== -1) {
      apiData.value.data[routeIndex].isEnabled = newEnabled;
    }
  }

  try {
    // Create a specific instance for this route update
    const { execute: updateSpecificRoute } = useApiLazy(
      () => `/route_definition/${routeItem.id}`,
      {
        method: "patch",
        errorContext: "Toggle Route",
      }
    );

    await updateSpecificRoute({ body: { isEnabled: newEnabled } });

    toast.add({
      title: "Success",
      description: `Route ${newEnabled ? "enabled" : "disabled"} successfully`,
      color: "success",
    });
  } catch (error) {
    // Revert optimistic update on error
    if (apiData.value?.data) {
      const routeIndex = apiData.value.data.findIndex(
        (r: any) => r.id === routeItem.id
      );
      if (routeIndex !== -1) {
        apiData.value.data[routeIndex].isEnabled = !newEnabled;
      }
    }

    toast.add({
      title: "Error",
      description: "Failed to update route status",
      color: "error",
    });
  }
}
</script>

<template>
  <div class="space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <div v-if="loading">
        <CommonLoadingState
          title="Loading routes..."
          description="Fetching routing configuration"
          size="sm"
          type="card"
          context="page"
        />
      </div>

      <div v-else class="space-y-6">
        <div v-if="routes.length" class="space-y-6">
          <div class="grid gap-4" :class="isTablet ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'">
            <CommonSettingsCard
              v-for="routeItem in routes"
              :key="routeItem.id"
              :title="routeItem.path"
              :description="routeItem.mainTable.name"
              :icon="routeItem.icon || 'lucide:circle'"
              icon-color="primary"
              :card-class="'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all'"
              @click="navigateTo(`/settings/routings/${routeItem.id}`)"
              :stats="[
                {
                  label: 'Status',
                  component: 'UBadge',
                  props: { 
                    variant: 'soft', 
                    color: routeItem.isEnabled ? 'success' : 'warning',
                    size: 'xs'
                  },
                  value: routeItem.isEnabled ? 'Enabled' : 'Disabled'
                },
                ...(routeItem.isSystem ? [{
                  label: 'System',
                  component: 'UBadge',
                  props: { variant: 'soft', color: 'info', size: 'xs' },
                  value: 'System'
                }] : []),
                ...(routeItem.order ? [{
                  label: 'Order',
                  value: routeItem.order
                }] : []),
                ...(routeItem.publishedMethods?.length ? [{
                  label: 'Methods',
                  value: routeItem.publishedMethods.map((m: any) => m.method).join(', ')
                }] : [])
              ]"
              :actions="[]"
            >
              <template #headerActions>
                <USwitch
                  v-if="!routeItem.isSystem"
                  :model-value="routeItem.isEnabled"
                  @update:model-value="toggleEnabled(routeItem)"
                  label="Is enabled"
                  :disabled="getRouteLoader(routeItem.id).isLoading"
                  @click.stop
                />
              </template>
            </CommonSettingsCard>
          </div>
        </div>

        <CommonEmptyState
          v-else-if="!loading"
          title="No routes found"
          description="No routing configurations have been created yet"
          icon="lucide:route"
          size="sm"
        />

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
    </Transition>
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
