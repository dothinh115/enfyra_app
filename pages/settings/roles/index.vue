<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const route = useRoute();
const tableName = "role_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

// Mounted state để đánh dấu first render
const isMounted = ref(false);

// API composable for fetching roles
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

// Computed values from API data
const roles = computed(() => apiData.value?.data || []);
const total = computed(() => {
  // Use filterCount when there are active filters, otherwise use totalCount
  // Note: This page doesn't have filters yet, but keeping the logic consistent
  return apiData.value?.meta?.totalCount || 0;
});

// Register header actions
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

async function deleteRole(id: string) {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  // Create a specific instance for this role deletion
  const { execute: removeSpecificRole, error: deleteError } = useApiLazy(
    () => `/role_definition/${id}`,
    {
      method: "delete",
      errorContext: "Delete Role",
    }
  );

  await removeSpecificRole();

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
        title="Loading roles..."
        description="Fetching role definitions"
        size="sm"
        type="card"
        context="page"
      />

      <!-- Roles Grid: khi có data -->
      <div
        v-else-if="roles.length"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard v-for="role in roles" :key="role.id" class="relative group">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <Icon name="lucide:shield-check" class="w-5 h-5 text-primary" />
              </div>
              <div>
                <div class="font-medium">{{ role.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ role.description || "No description" }}
                </div>
              </div>
            </div>
          </template>

          <div class="text-sm text-muted-foreground space-y-2">
            <div class="flex items-center justify-between">
              <span>Created:</span>
              <span>{{ new Date(role.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <template #footer>
            <div class="flex gap-2">
              <UButton
                icon="lucide:eye"
                variant="outline"
                size="sm"
                :to="`/settings/roles/${role.id}`"
                block
              >
                View Details
              </UButton>
              <UButton
                v-if="!role.isSystem"
                icon="lucide:trash"
                variant="outline"
                size="sm"
                color="error"
                @click="deleteRole(role.id)"
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
        title="No roles found"
        description="No role definitions have been created yet"
        icon="lucide:shield-check"
        size="sm"
      />
    </Transition>

    <!-- Pagination - chỉ hiển thị khi có data -->
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
