<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const route = useRoute();
const tableName = "route_definition";
const { getIncludeFields } = useSchema(tableName);
const routes = ref<any[]>([]);

// API composable for fetching routes
const {
  data: apiData,
  pending: loading,
  execute: fetchRoutes,
} = useApiLazy(() => "/route_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "-createdAt",
    meta: "*",
    page: page.value,
    limit: pageLimit,
  })),
  errorContext: "Fetch Routes",
});

// Computed values from API data
const routesData = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Register header actions
useHeaderActionRegistry({
  id: "create-routing",
  label: "Create Routing",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  to: "/settings/routings/create",
  class: "rounded-full",
  permission: {
    and: [
      {
        route: "/route_definition",
        actions: ["create"],
      },
    ],
  },
});

// Update routes when data changes
watch(
  routesData,
  (newRoutes) => {
    routes.value = newRoutes;
  },
  { immediate: true }
);

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRoutes();
  },
  { immediate: true }
);

async function toggleEnabled(routeItem: any) {
  const newEnabled = !routeItem.isEnabled;

  // Create a specific instance for this route update
  const { execute: updateSpecificRoute } = useApiLazy(
    () => `/route_definition/${routeItem.id}`,
    {
      method: "patch",
      errorContext: "Toggle Route",
    }
  );

  try {
    await updateSpecificRoute({ body: { isEnabled: newEnabled } });
    // If successful, update the local state
    const index = routes.value.findIndex((r) => r.id === routeItem.id);
    if (index !== -1) {
      routes.value[index] = { ...routes.value[index], isEnabled: newEnabled };
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
      title="Loading routes..."
      description="Fetching routing configuration"
      size="sm"
      type="card"
      context="page"
    />
    <div v-else-if="routes.length" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ULink
          :to="`/settings/routings/${route.id}`"
          v-for="route in routes"
          :key="route.id"
          class="cursor-pointer relative z-10"
        >
          <UCard
            class="h-full hover:bg-gray-50 dark:hover:bg-gray-800 transition hover:shadow-md"
            variant="subtle"
          >
            <div class="flex flex-col h-full gap-3">
              <div class="flex items-center gap-3">
                <Icon
                  :name="route.icon || 'lucide:circle'"
                  class="text-xl text-primary mt-1"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-primary truncate">
                    {{ route.path }}
                  </div>
                  <div class="text-sm text-gray-500 truncate">
                    {{ route.mainTable.name }}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  :color="route.isEnabled ? 'success' : 'warning'"
                  size="xs"
                >
                  {{ route.isEnabled ? "Enabled" : "Disabled" }}
                </UBadge>
                <UBadge v-if="route.isSystem" color="info" size="xs">
                  System
                </UBadge>
              </div>

              <!-- Published methods inline -->
              <div
                v-if="route.publishedMethods?.length"
                class="flex items-center gap-2"
              >
                <span class="text-xs text-gray-400">Published Methods:</span>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="method in route.publishedMethods"
                    :key="method.method"
                    size="xs"
                    color="secondary"
                  >
                    {{ method.method }}
                  </UBadge>
                </div>
              </div>

              <div class="flex items-center justify-between mt-auto">
                <USwitch
                  :model-value="route.isEnabled"
                  @update:model-value="toggleEnabled(route)"
                  label="Is enabled"
                  @click.prevent
                  v-if="!route.isSystem"
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
</template>
