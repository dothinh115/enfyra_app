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
      type="table"
      context="page"
    />
    <div class="space-y-3 flex flex-col" v-else-if="routes.length">
      <ULink
        :to="`/settings/routings/${route.id}`"
        v-for="route in routes"
        class="cursor-pointer relative z-10 cursor-pointer"
      >
        <UCard
          :key="route.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <Icon
                :name="route.icon || 'lucide:circle'"
                class="text-xl text-primary mt-1"
              />
              <div class="space-y-1">
                <div class="flex space-x-1 items-center">
                  <span class="text-xs text-gray-400">Path:</span>
                  <div class="font-medium text-primary">{{ route.path }}</div>
                </div>
                <div class="flex space-x-1 items-center">
                  <span class="text-xs text-gray-400">Table:</span>
                  <div class="text-sm text-gray-300">
                    {{ route.mainTable.name }}
                  </div>
                </div>
                <div
                  class="flex space-x-1 items-center"
                  v-if="route.publishedMethods?.length"
                >
                  <span class="text-xs text-gray-400">Published Methods:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge
                      v-for="m in route.publishedMethods"
                      :key="m"
                      size="xs"
                      color="secondary"
                    >
                      {{ m.method }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-end">
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
    <CommonEmptyState
      v-else-if="!loading"
      title="No routes found"
      description="No routing configurations have been created yet"
      icon="lucide:route"
      size="sm"
    />

    <div class="flex justify-center mt-6">
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
        v-if="!loading"
      />
    </div>
  </div>
</template>
