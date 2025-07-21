<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const total = ref(0);
const roles = ref<any[]>([]);
const route = useRoute();
const { confirm } = useConfirm();

async function fetchRoles(page = 1, limit = 10) {
  try {
    const { data } = await useApiLazy("/role_definition", {
      query: {
        fields: "*",
        sort: "-createdAt",
        meta: "*",
        page,
        limit,
      },
    });

    roles.value = data.value.data;
    total.value = data.value.meta.totalCount;
  } catch (error) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tải danh sách vai trò",
      color: "error",
    });
  }
}

async function deleteRole(id: string) {
  const ok = await confirm({
    title: "Are you sure?",
    content: "You cannot go back",
  });
  if (!ok) return;

  try {
    await useApi(`/role_definition/${id}`, {
      method: "delete",
    });
    toast.add({ title: "Đã xoá vai trò", color: "success" });
    await fetchRoles(page.value, pageLimit);
  } catch (error) {
    toast.add({
      title: "Lỗi",
      description: "Không thể xoá vai trò",
      color: "error",
    });
  }
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
    <div class="space-y-3" v-if="roles.length">
      <ULink
        v-for="role in roles"
        :key="role.id"
        :to="`/settings/roles/${role.id}`"
      >
        <UCard
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="space-y-1 flex-1">
              <div class="text-base font-semibold text-primary">
                {{ role.name || "Chưa đặt tên" }}
              </div>
              <div
                class="text-sm text-muted-foreground"
                v-if="role.description"
              >
                {{ role.description }}
              </div>
            </div>
            <div class="shrink-0">
              <UButton
                icon="lucide:trash-2"
                size="xl"
                color="error"
                @click.stop.prevent="deleteRole(role.id)"
              />
            </div>
          </div>
        </UCard>
      </ULink>
    </div>

    <div v-else class="text-sm text-gray-400 text-center">
      Không có vai trò nào.
    </div>

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
        v-if="total > pageLimit"
      />
    </div>
  </div>
</template>
