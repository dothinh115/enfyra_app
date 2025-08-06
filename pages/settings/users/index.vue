<template>
  <div class="space-y-4">
    <CommonLoadingState
      v-if="loading"
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

    <div class="flex justify-center mt-4" v-if="!loading">
      <UPagination
        v-model="page"
        :page-count="limit"
        :total="total"
        size="sm"
        v-if="total > limit"
      />
    </div>
  </div>
</template>
<script setup lang="ts">

const page = ref(1);
const limit = 12;
const tableName = "user_definition";
const { getIncludeFields } = useSchema(tableName);

// API composable
const {
  data: apiData,
  pending: loading,
  execute: fetchUsers
} = useApiLazy(() => "/user_definition", {
  query: computed(() => ({
    fields: getIncludeFields(),
    page: page.value,
    limit,
    sort: "-createdAt",
    meta: "totalCount",
  })),
  errorContext: "Fetch Users"
});

// Computed values from API data
const users = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

watch(page, () => fetchUsers());
onMounted(() => fetchUsers());
</script>
