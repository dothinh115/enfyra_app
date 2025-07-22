<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const total = ref(0);
const route = useRoute();
const tableName = "hook_definition";
const hooks = ref<any[]>([]);
const { getFullRelationQuery } = useSchema(tableName);

async function fetchHooks(page = 1, limit: number) {
  try {
    const { data } = await useApiLazy("/hook_definition", {
      query: {
        fields: getFullRelationQuery(),
        sort: "-createdAt",
        meta: "*",
        page,
        limit,
      },
    });
    hooks.value = data.value.data;
    total.value = data.value.meta.totalCount;
  } catch (error) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tải danh sách hooks",
      color: "error",
    });
  }
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchHooks(page.value, pageLimit);
  },
  { immediate: true }
);

async function toggleEnabled(hook: any) {
  hook.isEnabled = !hook.isEnabled;
  await useApi(`/hook_definition/${hook.id}`, {
    method: "patch",
    body: { isEnabled: hook.isEnabled },
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3 flex flex-col">
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

              <div class="flex items-center space-x-1" v-if="hook.type">
                <span class="text-xs text-gray-400">Type:</span>
                <UBadge color="secondary" size="xs">{{ hook.type }}</UBadge>
              </div>

              <div class="flex items-center space-x-1" v-if="hook.route?.path">
                <span class="text-xs text-gray-400">Route:</span>
                <span class="text-sm text-gray-300">{{ hook.route.path }}</span>
              </div>

              <div
                class="flex items-center space-x-1"
                v-if="hook.route?.mainTable?.name"
              >
                <span class="text-xs text-gray-400">Main table:</span>
                <span class="text-sm text-gray-300">{{
                  hook.route.mainTable.name
                }}</span>
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

    <div class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
        v-if="page > 1"
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
