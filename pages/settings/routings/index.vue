<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const route = useRoute();
const tableName = "route_definition";
const { getIncludeFields } = useSchema(tableName);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createLoader } = useLoader();
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
    <CommonLoadingState
      v-if="loading"
      title="Loading routes..."
      description="Fetching routing configuration"
      size="sm"
      type="card"
      context="page"
    />
    <div v-else-if="routes.length" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ULink
          :to="`/settings/routings/${routeItem.id}`"
          v-for="routeItem in routes"
          :key="routeItem.id"
          class="cursor-pointer relative z-10"
        >
          <UCard
            class="h-full hover:bg-gray-50 dark:hover:bg-gray-800 transition hover:shadow-md"
            variant="subtle"
          >
            <div class="flex flex-col h-full gap-3">
              <div class="flex items-center gap-3">
                <Icon
                  :name="routeItem.icon || 'lucide:circle'"
                  class="text-xl text-primary mt-1"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-primary truncate">
                    {{ routeItem.path }}
                  </div>
                  <div class="text-sm text-gray-500 truncate">
                    {{ routeItem.mainTable.name }}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  :color="routeItem.isEnabled ? 'success' : 'warning'"
                  size="xs"
                >
                  {{ routeItem.isEnabled ? "Enabled" : "Disabled" }}
                </UBadge>
                <UBadge v-if="routeItem.isSystem" color="info" size="xs">
                  System
                </UBadge>
                <UBadge v-if="routeItem.order" color="secondary" size="xs">
                  Order: {{ routeItem.order }}
                </UBadge>
              </div>

              <!-- Published methods inline -->
              <div
                v-if="routeItem.publishedMethods?.length"
                class="flex items-center gap-2"
              >
                <span class="text-xs text-gray-400">Published Methods:</span>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="method in routeItem.publishedMethods"
                    :key="method.method"
                    size="xs"
                    color="secondary"
                  >
                    {{ method.method }}
                  </UBadge>
                </div>
              </div>

              <div class="flex items-center justify-end mt-auto">
                <USwitch
                  :model-value="routeItem.isEnabled"
                  @update:model-value="toggleEnabled(routeItem)"
                  label="Is enabled"
                  @click.prevent
                  :disabled="getRouteLoader(routeItem.id).isLoading"
                  v-if="!routeItem.isSystem"
                />
              </div>
            </div>
          </UCard>
        </ULink>
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

  <!-- Filter Drawer -->
  <FilterDrawer
    v-model="showFilterDrawer"
    v-model:filter-value="currentFilter"
    :table-name="tableName"
    @apply="applyFilters"
    @clear="clearFilters"
  />
</template>
