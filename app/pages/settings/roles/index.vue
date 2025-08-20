<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "role_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

const { isMounted } = useMounted();
const { isTablet } = useScreen();

const {
  data: apiData,
  pending: loading,
  execute: fetchRoles,
} = useApiLazy(() => "/role_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    sort: "-createdAt",
    meta: "*",
    page: page.value,
    limit: pageLimit,
  })),
  errorContext: "Fetch Roles",
});

const roles = computed(() => apiData.value?.data || []);
const total = computed(() => {
  return apiData.value?.meta?.totalCount || 0;
});

useHeaderActionRegistry({
  id: "create-role",
  label: "Create Role",
  icon: "lucide:plus",
  variant: "solid",
  color: "primary",
  size: "md",
  to: "/settings/roles/create",
  permission: {
    and: [
      {
        route: "/role_definition",
        actions: ["create"],
      },
    ],
  },
});

const { execute: deleteRoleApi, error: deleteError } = useApiLazy(
  () => `/role_definition`,
  {
    method: "delete",
    errorContext: "Delete Role",
  }
);

async function deleteRole(id: string) {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  await deleteRoleApi({ id });

  if (deleteError.value) {
    return;
  }

  toast.add({ title: "Role deleted", color: "success" });
  await fetchRoles();
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRoles();
  },
  { immediate: true }
);

// Remove empty onMounted
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <CommonPageHeader
      title="Role Manager"
      title-size="md"
      show-background
      background-gradient="from-amber-500/8 via-orange-400/5 to-transparent"
      padding-y="py-6"
    />
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading roles..."
        description="Fetching role definitions"
        size="sm"
        type="card"
        context="page"
      />

      <div
        v-else-if="roles.length"
        class="grid gap-4"
        :class="
          isTablet
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        "
      >
        <CommonSettingsCard
          v-for="role in roles"
          :key="role.id"
          :title="role.name"
          :description="role.description || 'No description'"
          icon="lucide:shield-check"
          icon-color="primary"
          :card-class="'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all'"
          @click="navigateTo(`/settings/roles/${role.id}`)"
          :stats="[
            {
              label: 'Created',
              value: new Date(role.createdAt).toLocaleDateString(),
            },
          ]"
          :actions="[]"
          :header-actions="!role.isSystem ? [{
            component: 'UButton',
            props: {
              icon: 'i-heroicons-trash',
              variant: 'outline',
              color: 'error'
            },
            onClick: (e?: Event) => {
              e?.stopPropagation();
              deleteRole(role.id);
            }
          }] : []"
        />
      </div>

      <CommonEmptyState
        v-else
        title="No roles found"
        description="No role definitions have been created yet"
        icon="lucide:shield-check"
        size="sm"
      />
    </Transition>

    <div class="flex justify-center" v-if="!loading && roles.length > 0">
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
