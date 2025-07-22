<template>
  <div class="space-y-4">
    <div class="text-xl font-semibold">Users</div>

    <div v-if="loading" class="text-muted text-sm">Loading...</div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <UCard v-for="user in users" :key="user.id" class="relative group">
        <template #header>
          <div class="flex items-center gap-3">
            <UAvatar
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.name"
              size="md"
            />
            <UAvatar v-else :alt="user.name" size="md">
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
            <div>Tham gia:</div>
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
            Xem chi tiết
          </UButton>
        </template>
      </UCard>
    </div>

    <div class="flex justify-center mt-4">
      <UPagination
        v-model="page"
        :page-count="limit"
        :total="total"
        size="sm"
        v-if="page > 1"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
const users = ref<any[]>([]);
const page = ref(1);
const total = ref(0);
const limit = 12;
const loading = ref(false);
const tableName = "user_definition";
const { getFullRelationQuery } = useSchema(tableName);

async function fetchUsers() {
  loading.value = true;
  const { data } = await useApiLazy("/user_definition", {
    query: {
      fields: getFullRelationQuery(),
      page: page.value,
      limit,
      sort: "-createdAt",
      meta: "totalCount",
    },
  });
  users.value = data.value?.data || [];
  total.value = data.value?.meta?.totalCount || 0;
  loading.value = false;
}

watch(page, fetchUsers);
onMounted(fetchUsers);
</script>
