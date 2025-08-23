<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 9;
const route = useRoute();
const tableName = "route_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();
const { createLoader } = useLoader();
const { isTablet } = useScreen();
const routes = ref<any[]>([]);

const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

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
  }
);

// Handle filter apply from FilterDrawer
async function handleFilterApply(filter: FilterGroup) {
  currentFilter.value = filter;
  page.value = 1;
  await fetchRoutes();
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRoutes();
  }
);

// Update API at setup level
const { execute: updateRouteApi, error: updateError } = useApiLazy(
  () => `/route_definition`,
  {
    method: "patch",
    errorContext: "Toggle Route",
  }
);

// Delete API at setup level
const { execute: deleteRouteApi, error: deleteError } = useApiLazy(
  () => `/route_definition`,
  {
    method: "delete",
    errorContext: "Delete Route",
  }
);

// Create loaders for each route toggle button
const routeLoaders = ref<Record<string, any>>({});

function getRouteLoader(routeId: string) {
  if (!routeLoaders.value[routeId]) {
    routeLoaders.value[routeId] = createLoader();
  }
  return routeLoaders.value[routeId];
}

function getRouteHeaderActions(routeItem: any) {
  if (routeItem.isSystem) {
    return [];
  }

  return [
    {
      component: 'USwitch',
      props: {
        'model-value': routeItem.isEnabled,
        disabled: getRouteLoader(routeItem.id).isLoading
      },
      onClick: (e?: Event) => e?.stopPropagation(),
      onUpdate: () => toggleEnabled(routeItem)
    },
    {
      component: 'UButton',
      props: {
        icon: 'i-heroicons-trash',
        variant: 'outline',
        color: 'error'
      },
      onClick: (e?: Event) => {
        e?.stopPropagation();
        deleteRoute(routeItem);
      }
    }
  ];
}

async function toggleEnabled(routeItem: any) {
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

  await updateRouteApi({ id: routeItem.id, body: { isEnabled: newEnabled } });

  if (updateError.value) {
    // Revert optimistic update on error
    if (apiData.value?.data) {
      const routeIndex = apiData.value.data.findIndex(
        (r: any) => r.id === routeItem.id
      );
      if (routeIndex !== -1) {
        apiData.value.data[routeIndex].isEnabled = !newEnabled;
      }
    }
    return;
  }

  toast.add({
    title: "Success",
    description: `Route ${newEnabled ? "enabled" : "disabled"} successfully`,
    color: "success",
  });
}

async function deleteRoute(routeItem: any) {
  const isConfirmed = await confirm({
    title: "Delete Route",
    content: `Are you sure you want to delete route "${routeItem.path}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    await deleteRouteApi({ id: routeItem.id });

    if (deleteError.value) {
      return;
    }

    await fetchRoutes();

    toast.add({
      title: "Success",
      description: `Route "${routeItem.path}" has been deleted successfully!`,
      color: "success",
    });
  }
}

onMounted(fetchRoutes);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <CommonPageHeader
      title="Routing Manager"
      title-size="md"
      show-background
      background-gradient="from-lime-500/8 via-green-400/5 to-transparent"
      padding-y="py-6"
    />
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
          <div
            class="grid gap-4"
            :class="
              isTablet
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            "
          >
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
                  },
                  value: routeItem.isEnabled ? 'Enabled' : 'Disabled'
                },
                ...(routeItem.isSystem ? [{
                  label: 'System',
                  component: 'UBadge',
                  props: { variant: 'soft', color: 'info', },
                  value: 'System'
                }] : []),
                ...(routeItem.order ? [{
                  label: 'Order',
                  value: routeItem.order
                }] : []),
                ...(routeItem.publishedMethods?.length ? [{
                  label: 'Methods',
                  component: 'UBadge',
                  values: routeItem.publishedMethods.map((m: any) => ({
                    value: m.method.toUpperCase(),
                    props: {
                      color: m.method === 'GET' ? 'info' : 
                             m.method === 'POST' ? 'success' : 
                             m.method === 'PATCH' ? 'warning' : 
                             m.method === 'DELETE' ? 'error' : undefined
                    }
                  }))
                }] : [])
              ]"
              :actions="[]"
              :header-actions="getRouteHeaderActions(routeItem)"
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
  <FilterDrawerLazy
    v-model="showFilterDrawer"
    :table-name="tableName"
    :current-filter="currentFilter"
    @apply="handleFilterApply"
  />
</template>
