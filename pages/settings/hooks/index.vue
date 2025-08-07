<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const route = useRoute();
const tableName = "hook_definition";
const { getIncludeFields } = useSchema(tableName);

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
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Register header actions
useHeaderActionRegistry({
  id: "create-hook",
  label: "Create Hook",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "lg",
  to: "/settings/hooks/create",
  class: "rounded-full",
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
</script>

<template>
  <div class="space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading hooks..."
      description="Fetching webhook configurations"
      size="sm"
      type="table"
      context="page"
    />
    <div class="space-y-3 flex flex-col" v-else-if="hooks.length">
      <ULink
        :to="`/settings/hooks/${hook.id}`"
        v-for="hook in hooks"
        :key="hook.id"
        class="cursor-pointer relative z-10"
      >
        <UCard
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center space-x-1">
                <span class="text-xs text-gray-400">Hook name:</span>
                <span class="text-sm font-semibold text-primary">{{
                  hook.name
                }}</span>
              </div>

              <div class="flex items-center space-x-1">
                <span class="text-xs text-gray-400">Route:</span>
                <span class="text-sm text-gray-300">{{
                  hook.route?.path ?? "All path"
                }}</span>
              </div>

              <div class="flex items-center space-x-1 flex-wrap">
                <span class="text-xs text-gray-400">Methods:</span>
                <UBadge
                  color="primary"
                  size="xs"
                  variant="solid"
                  v-for="(item, index) in hook.methods"
                  :key="index"
                  v-if="hook.methods.length"
                >
                  {{ item?.method }}
                </UBadge>
                <UBadge color="primary" size="xs" variant="solid" v-else>
                  All methods
                </UBadge>
              </div>
            </div>

            <div class="flex items-end">
              <USwitch
                :model-value="hook.isEnabled"
                @update:model-value="toggleEnabled(hook)"
                label="Is enabled"
                @click.prevent
                v-if="!hook.isSystem"
              />
            </div>
          </div>
        </UCard>
      </ULink>
    </div>
    <CommonEmptyState
      v-else-if="!loading"
      title="No hooks found"
      description="No webhook configurations have been created yet"
      icon="lucide:webhook"
      size="sm"
    />

    <div class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
        v-if="page > 1 && !loading"
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
