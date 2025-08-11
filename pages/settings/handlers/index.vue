<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "route_handler_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

// Mounted state để đánh dấu first render
const isMounted = ref(false);

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
const total = computed(() => {
  // Use filterCount when there are active filters, otherwise use totalCount
  // Note: This page doesn't have filters yet, but keeping the logic consistent
  return apiData.value?.meta?.totalCount || 0;
});

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

  await deleteSpecificHandler();

  toast.add({ title: "Deleted", color: "success" });
  await fetchRouteHandlers();
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRouteHandlers();
  },
  { immediate: true }
);

onMounted(async () => {
  isMounted.value = true;
});
</script>

<template>
  <div class="space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <!-- Loading State: khi chưa mounted hoặc đang loading -->
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading handlers..."
        description="Fetching route handlers"
        size="sm"
        type="card"
        context="page"
      />

      <!-- Handlers Grid: khi có data -->
      <div v-else-if="routeHandlers.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="handler in routeHandlers" :key="handler.id" class="relative group">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Icon name="lucide:command-line" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <div class="font-medium">{{ handler.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ handler.description || "No description" }}
                </div>
              </div>
            </div>
          </template>

          <div class="text-sm text-muted-foreground space-y-2">
            <div class="flex items-center justify-between">
              <span>Type:</span>
              <UBadge variant="soft" color="primary">
                {{ handler.type || "Unknown" }}
              </UBadge>
            </div>
            <div class="flex items-center justify-between">
              <span>Created:</span>
              <span>{{ new Date(handler.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <template #footer>
            <div class="flex gap-2">
              <UButton
                icon="lucide:eye"
                variant="outline"
                size="sm"
                :to="`/settings/handlers/${handler.id}`"
                block
              >
                View Details
              </UButton>
              <UButton
                v-if="!handler.isSystem"
                icon="lucide:trash"
                variant="outline"
                size="sm"
                color="error"
                @click="deleteHandler(handler.id)"
                block
              >
                Delete
              </UButton>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <CommonEmptyState
        v-else
        title="No handlers found"
        description="No route handlers have been created yet"
        icon="lucide:command-line"
        size="sm"
      />
    </Transition>

    <!-- Pagination - chỉ hiển thị khi có data -->
    <div class="flex justify-center" v-if="!loading && routeHandlers.length > 0">
      <UPagination
        v-model="page"
        :page-count="pageLimit"
        :total="total"
        size="sm"
        v-if="total > pageLimit"
      />
    </div>
  </div>
</template>
