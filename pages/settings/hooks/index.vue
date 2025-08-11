<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const route = useRoute();
const tableName = "hook_definition";
const { getIncludeFields } = useSchema(tableName);

// Mounted state để đánh dấu first render
const isMounted = ref(false);

// API composable for fetching hooks
const {
  data: apiData,
  pending: loading,
  execute: fetchHooks,
} = useApiLazy(() => "/hook_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "-createdAt",
    meta: "*",
    page: page.value,
    limit: pageLimit,
  })),
  errorContext: "Fetch Hooks",
});

// API composable for updating hooks (reusable)
const { execute: updateHook } = useApiLazy(() => `/hook_definition/0`, {
  method: "patch",
  errorContext: "Toggle Hook",
});

// Computed values from API data
const hooks = computed(() => apiData.value?.data || []);
const total = computed(() => {
  // Use filterCount when there are active filters, otherwise use totalCount
  // Note: This page doesn't have filters yet, but keeping the logic consistent
  return apiData.value?.meta?.totalCount || 0;
});

// Register header actions
useHeaderActionRegistry({
  id: "create-hook",
  label: "Create Hook",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "md",
  to: "/settings/hooks/create",
  permission: {
    and: [
      {
        route: "/hook_definition",
        actions: ["create"],
      },
    ],
  },
});

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchHooks();
  },
  { immediate: true }
);

async function toggleEnabled(hook: any) {
  const originalEnabled = hook.isEnabled;
  hook.isEnabled = !hook.isEnabled;

  // Create a specific instance for this hook update
  const { execute: updateSpecificHook } = useApiLazy(
    () => `/hook_definition/${hook.id}`,
    {
      method: "patch",
      errorContext: "Toggle Hook",
    }
  );

  try {
    await updateSpecificHook({ body: { isEnabled: hook.isEnabled } });
  } catch (error) {
    // Revert the toggle on error
    hook.isEnabled = originalEnabled;
  }
}

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
        title="Loading hooks..."
        description="Fetching webhook configurations"
        size="sm"
        type="card"
        context="page"
      />

      <!-- Hooks List: khi có data -->
      <div v-else-if="hooks.length" class="space-y-3 flex flex-col">
        <ULink
          v-for="hook in hooks"
          :key="hook.id"
          :to="`/settings/hooks/${hook.id}`"
        >
          <UCard
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            variant="subtle"
          >
            <div class="flex justify-between items-start gap-4">
              <div class="space-y-1 flex-1">
                <div class="text-base font-semibold text-primary">
                  {{ hook.name || "Unnamed" }}
                </div>
                <div class="text-sm text-gray-400">
                  Route: <code>{{ hook.route?.path || "N/A" }}</code>
                </div>
                <div
                  class="text-sm text-muted-foreground"
                  v-if="hook.description"
                >
                  {{ hook.description }}
                </div>
              </div>

              <!-- Toggle button -->
              <div class="shrink-0">
                <USwitch
                  v-model="hook.isEnabled"
                  @update:model-value="toggleEnabled(hook)"
                  :disabled="hook.isSystem"
                />
              </div>
            </div>
          </UCard>
        </ULink>
      </div>

      <!-- Empty State: khi đã mounted, không loading và không có data -->
      <CommonEmptyState
        v-else
        title="No hooks found"
        description="No webhook configurations have been created yet"
        icon="lucide:link"
        size="sm"
      />
    </Transition>

    <!-- Pagination - chỉ hiển thị khi có data -->
    <div class="flex justify-center" v-if="!loading && hooks.length > 0">
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
