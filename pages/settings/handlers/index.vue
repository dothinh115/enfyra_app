<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "route_handler_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

// API composable for fetching handlers
const {
  data: apiData,
  pending: loading,
  execute: fetchRouteHandlers,
} = useApiLazy(() => "/route_handler_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "-createdAt",
    meta: "*",
    page: page.value,
    limit: pageLimit,
  })),
  errorContext: "Fetch Route Handlers",
});

// API composable for deleting handlers (reusable)
const { execute: removeHandler } = useApiLazy(
  () => `/route_handler_definition/0`,
  {
    method: "delete",
    errorContext: "Delete Handler",
  }
);

// Computed values from API data
const routeHandlers = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Register header actions
useHeaderActionRegistry({
  id: "create-handler",
  label: "Create Handler",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "md",
  to: "/settings/handlers/create",
  permission: {
    and: [
      {
        route: "/route_handler_definition",
        actions: ["create"],
      },
    ],
  },
});

async function deleteHandler(id: number) {
  const ok = await confirm({
    title: "Are you sure?",
  });
  if (!ok) return;

  // Create a specific instance for this deletion
  const { execute: deleteSpecificHandler } = useApiLazy(
    () => `/route_handler_definition/${id}`,
    {
      method: "delete",
      errorContext: "Delete Handler",
    }
  );

  try {
    await deleteSpecificHandler();

    toast.add({ title: "Deleted", color: "success" });
    await fetchRouteHandlers();
  } catch (error) {
    // Error already handled by useApiLazy
  }
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRouteHandlers();
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading handlers..."
      description="Fetching route handlers"
      size="sm"
      type="table"
      context="page"
    />
    <div class="space-y-3" v-else-if="routeHandlers.length">
      <ULink
        v-for="handler in routeHandlers"
        :key="handler.id"
        :to="`/settings/handlers/${handler.id}`"
      >
        <UCard
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="space-y-1 flex-1">
              <div class="text-base font-semibold text-primary">
                {{ handler.method?.method || "Unknown method" }}
              </div>
              <div class="text-sm text-gray-400">
                Route: <code>{{ handler.route?.path || "N/A" }}</code>
              </div>
              <div
                class="text-sm text-muted-foreground"
                v-if="handler.description"
              >
                {{ handler.description }}
              </div>
            </div>

            <!-- Delete button -->
            <div class="shrink-0">
              <PermissionGate
                :condition="{
                  and: [
                    {
                      route: '/route_handler_definition',
                      actions: ['delete'],
                    },
                  ],
                }"
              >
                <UButton
                  icon="lucide:trash-2"
                  size="xl"
                  color="error"
                  @click.stop.prevent="deleteHandler(handler.id)"
                />
              </PermissionGate>
            </div>
          </div>
        </UCard>
      </ULink>
    </div>
    <CommonEmptyState
      v-else-if="!loading"
      title="No handlers found"
      description="No route handlers have been created yet"
      icon="lucide:code"
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
        v-if="page > 1 && !loading"
      />
    </div>
  </div>
</template>
