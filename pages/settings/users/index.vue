<template>
  <div class="space-y-4">
    <Transition name="loading-fade" mode="out-in">
      <CommonLoadingState
        v-if="!isMounted || loading"
        title="Loading users..."
        description="Fetching user accounts"
        size="sm"
        type="card"
        context="page"
      />

      <div
        v-else-if="users.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <UCard v-for="user in users" :key="user.id" class="relative group">
          <template #header>
            <div class="flex items-center gap-3">
              <UAvatar
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.name"
                size="sm"
              />
              <UAvatar v-else :alt="user.name" size="sm">
                {{ user.email?.charAt(0)?.toUpperCase() || "?" }}
              </UAvatar>

              <div>
                <div class="font-medium truncate">{{ user.name }}</div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ user.email }}
                </div>
              </div>
            </div>
          </template>

          <div class="text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <div>Role:</div>
              <UBadge variant="soft" color="primary" v-if="user.role">{{
                user.role.name
              }}</UBadge>
            </div>
            <div class="flex items-center justify-between mt-1">
              <div>Joined:</div>
              <div>{{ new Date(user.createdAt).toLocaleDateString() }}</div>
            </div>
          </div>

          <template #footer>
            <UButton
              icon="lucide:eye"
              variant="outline"
              size="sm"
              block
              :to="`/settings/users/${user.id}`"
            >
              View Details
            </UButton>
          </template>
        </UCard>
      </div>

      <CommonEmptyState
        v-else
        title="No users found"
        description="No user accounts have been created yet"
        icon="lucide:users"
        size="sm"
      />
    </Transition>

    <div class="flex justify-center mt-4" v-if="!loading && users.length > 0">
      <UPagination
        v-model="page"
        :page-count="limit"
        :total="total"
        size="sm"
        v-if="total > limit"
      />
    </div>

    <FilterDrawer
      v-model="showFilterDrawer"
      v-model:filter-value="currentFilter"
      :table-name="tableName"
      @apply="applyFilters"
      @clear="clearFilters"
    />
  </div>
</template>
<script setup lang="ts">
const page = ref(1);
const limit = 12;
const tableName = "user_definition";
const { getIncludeFields } = useSchema(tableName);
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();

const { isMounted } = useMounted();

const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

const {
  data: apiData,
  pending: loading,
  execute: fetchUsers,
} = useApiLazy(() => `/${tableName}`, {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      limit,
      page: page.value,
      fields: getIncludeFields(),
      meta: "*",
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
  errorContext: "Fetch Users",
});

const users = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

const filterLabel = computed(() => {
  const activeCount = currentFilter.value.conditions.length;
  return activeCount > 0 ? `Filters (${activeCount})` : "Filter";
});

const filterVariant = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "solid" : "outline";
});

const filterColor = computed(() => {
  return hasActiveFilters(currentFilter.value) ? "secondary" : "neutral";
});

useHeaderActionRegistry([
  {
    id: "filter-users",
    get label() {
      return filterLabel.value;
    },
    icon: "lucide:filter",
    get variant() {
      return filterVariant.value;
    },
    get color() {
      return filterColor.value;
    },
    size: "md",
    onClick: () => {
      showFilterDrawer.value = true;
    },
    permission: {
      and: [
        {
          route: `/${tableName}`,
          actions: ["read"],
        },
      ],
    },
  },
  {
    id: "create-user",
    label: "Create User",
    icon: "lucide:plus",
    variant: "solid",
    color: "primary",
    size: "md",
    to: "/settings/users/create",
    permission: {
      and: [
        {
          route: `/${tableName}`,
          actions: ["create"],
        },
      ],
    },
  },
]);

async function applyFilters() {
  page.value = 1;
  await fetchUsers();
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
  applyFilters();
}

watch(
  apiData,
  (newData) => {
    if (newData?.data) {
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await fetchUsers();
});
</script>
