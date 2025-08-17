<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 9;
const route = useRoute();
const tableName = "route_handler_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

const { isMounted } = useMounted();
const { isTablet } = useScreen();

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

const { execute: removeHandler } = useApiLazy(
  () => `/route_handler_definition/0`,
  {
    method: "delete",
    errorContext: "Delete Handler",
  }
);

const routeHandlers = computed(() => apiData.value?.data || []);
const total = computed(() => {
  return apiData.value?.meta?.totalCount || 0;
});

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

onMounted(async () => {});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-300">Handler Manager</h1>
    </div>
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading handlers..."
        description="Fetching route handlers"
        size="sm"
        type="card"
        context="page"
      />

      <div
        v-else-if="routeHandlers.length"
        class="grid gap-4"
        :class="
          isTablet
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        "
      >
        <CommonSettingsCard
          v-for="handler in routeHandlers"
          :key="handler.id"
          :title="handler.name"
          :description="handler.description || 'No description'"
          icon="lucide:command"
          icon-color="primary"
          :card-class="'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all'"
          @click="navigateTo(`/settings/handlers/${handler.id}`)"
          :stats="[
            {
              label: 'Type',
              component: 'UBadge',
              props: { variant: 'soft', color: 'primary' },
              value: handler.type || 'Unknown',
            },
            {
              label: 'Created',
              value: new Date(handler.createdAt).toLocaleDateString(),
            },
          ]"
          :actions="[]"
          :header-actions="!handler.isSystem ? [{
            component: 'UButton',
            props: {
              icon: 'i-heroicons-trash',
              variant: 'outline',
              color: 'error'
            },
            onClick: (e?: Event) => {
              e?.stopPropagation();
              deleteHandler(handler.id);
            }
          }] : []"
        />
      </div>

      <CommonEmptyState
        v-else
        title="No handlers found"
        description="No route handlers have been created yet"
        icon="lucide:terminal"
        size="sm"
      />
    </Transition>

    <div
      class="flex justify-center"
      v-if="!loading && routeHandlers.length > 0"
    >
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
