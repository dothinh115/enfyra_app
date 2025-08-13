<script setup lang="ts">
const toast = useToast();
const { confirm } = useConfirm();
const page = ref(1);
const pageLimit = 9;
const route = useRoute();
const tableName = "hook_definition";
const { getIncludeFields } = useSchema(tableName);

const { isMounted } = useMounted();
const { isTablet } = useScreen();

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

const { execute: updateHook } = useApiLazy(() => `/hook_definition/0`, {
  method: "patch",
  errorContext: "Toggle Hook",
});

const hooks = computed(() => apiData.value?.data || []);
const total = computed(() => {
  return apiData.value?.meta?.totalCount || 0;
});

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

async function toggleEnabled(hook: any, value?: boolean) {
  const originalEnabled = hook.isEnabled;
  hook.isEnabled = value !== undefined ? value : !hook.isEnabled;

  const { execute: updateSpecificHook, error: updateError } = useApiLazy(
    () => `/hook_definition/${hook.id}`,
    {
      method: "patch",
      errorContext: "Toggle Hook",
    }
  );

  await updateSpecificHook({ body: { isEnabled: hook.isEnabled } });

  if (updateError.value) {
    hook.isEnabled = originalEnabled;
  }
}

async function deleteHook(hook: any) {
  const isConfirmed = await confirm({
    title: "Delete Hook",
    content: `Are you sure you want to delete hook "${
      hook.name || "Unnamed"
    }"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
  });

  if (isConfirmed) {
    const { execute: deleteHookApi, error: deleteError } = useApiLazy(
      () => `/hook_definition/${hook.id}`,
      {
        method: "delete",
        errorContext: "Delete Hook",
      }
    );

    await deleteHookApi();

    if (deleteError.value) {
      return;
    }

    await fetchHooks();

    toast.add({
      title: "Success",
      description: `Hook "${
        hook.name || "Unnamed"
      }" has been deleted successfully!`,
      color: "success",
    });
  }
}

onMounted(async () => {});
</script>

<template>
  <div class="space-y-6">
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading hooks..."
        description="Fetching webhook configurations"
        size="sm"
        type="card"
        context="page"
      />

      <div
        v-else-if="hooks.length"
        class="grid gap-4"
        :class="
          isTablet
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        "
      >
        <CommonSettingsCard
          v-for="hook in hooks"
          :key="hook.id"
          :title="hook.name || 'Unnamed'"
          :description="hook.description || 'No description'"
          icon="lucide:link"
          icon-color="primary"
          :card-class="'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all'"
          @click="navigateTo(`/settings/hooks/${hook.id}`)"
          :stats="[
            {
              label: 'Route',
              value: hook.route?.path || 'N/A',
            },
            {
              label: 'Status',
              component: 'UBadge',
              props: {
                variant: 'soft',
                color: hook.isEnabled ? 'success' : 'neutral',
              },
              value: hook.isEnabled ? 'Active' : 'Inactive',
            },
            ...(hook.isSystem
              ? [
                  {
                    label: 'System',
                    component: 'UBadge',
                    props: { variant: 'soft', color: 'info' },
                    value: 'System',
                  },
                ]
              : []),
          ]"
          :actions="[]"
          :header-actions="!hook.isSystem ? [
            {
              component: 'USwitch',
              props: {
                modelValue: hook.isEnabled,
                onClick: (e: Event) => e.stopPropagation()
              },
              onUpdate: (value: boolean) => toggleEnabled(hook, value)
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
                deleteHook(hook);
              }
            }
          ] : []"
        />
      </div>

      <CommonEmptyState
        v-else
        title="No hooks found"
        description="No webhook configurations have been created yet"
        icon="lucide:link"
        size="sm"
      />
    </Transition>

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
