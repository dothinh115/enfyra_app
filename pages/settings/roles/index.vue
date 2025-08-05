<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const total = ref(0);
const roles = ref<any[]>([]);
const loading = ref(false);
const route = useRoute();
const tableName = "role_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

async function fetchRoles(page = 1, limit = 10) {
  loading.value = true;
  const { data, error } = await useApiLazy("/role_definition", {
    query: {
      fields: getIncludeFields(),
      sort: "-createdAt",
      meta: "*",
      page,
      limit,
    },
  });

  if (error.value) {
    toast.add({
      title: "Error",
      description: "Cannot load roles list",
      color: "error",
    });
    loading.value = false;
    return;
  }

  roles.value = data.value.data;
  total.value = data.value.meta.totalCount;
  loading.value = false;
}

async function deleteRole(id: string) {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  const { error } = await useApiLazy(`/role_definition/${id}`, {
    method: "delete",
  });

  if (error.value) {
    toast.add({
      title: "Error",
      description: "Cannot delete role",
      color: "error",
    });
    return;
  }

  toast.add({ title: "Role deleted", color: "success" });
  await fetchRoles(page.value, pageLimit);
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRoles(page.value, pageLimit);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6">
    <CommonLoadingState
      v-if="loading"
      title="Loading roles..."
      description="Fetching role definitions"
      size="sm"
    />

    <div v-else-if="roles.length">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <UCard
          v-for="role in roles"
          :key="role.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
          variant="subtle"
          @click="$router.push(`/settings/roles/${role.id}`)"
        >
          <div class="flex flex-col h-full justify-between">
            <div class="space-y-1">
              <div class="text-base font-semibold text-primary">
                {{ role.name || "Unnamed" }}
              </div>
              <div
                class="text-sm text-muted-foreground"
                v-if="role.description"
              >
                {{ role.description }}
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <UButton
                icon="lucide:trash-2"
                size="sm"
                color="error"
                variant="ghost"
                @click.stop="deleteRole(role.id)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <CommonEmptyState
      v-else
      title="No roles found"
      description="No role definitions have been created yet"
      icon="lucide:shield"
      size="sm"
    />

    <div class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
        :total="total"
        show-edges
        :sibling-count="1"
        :to="(p) => ({ path: route.path, query: { ...route.query, page: p } })"
        color="secondary"
        active-color="secondary"
        v-if="total > pageLimit && !loading"
      />
    </div>
  </div>
</template>
