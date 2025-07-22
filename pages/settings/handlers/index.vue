<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const total = ref(0);
const routeHandlers = ref<any[]>([]);
const route = useRoute();
const tableName = "route_handler_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);

async function fetchRouteHandlers(page = 1, limit = 10) {
  try {
    const { data } = await useApiLazy("/route_handler_definition", {
      query: {
        fields: getIncludeFields(),
        sort: "-createdAt",
        meta: "*",
        page,
        limit,
      },
    });
    routeHandlers.value = data.value.data;
    total.value = data.value.meta.totalCount;
  } catch (error) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tải danh sách route handlers",
      color: "error",
    });
  }
}

async function deleteHandler(id: number) {
  const ok = await confirm({
    title: "Are you sure?",
  });
  if (!ok) return;

  try {
    await useApi(`/route_handler_definition/${id}`, {
      method: "delete",
    });
    toast.add({ title: "Đã xoá", color: "success" });
    await fetchRouteHandlers(page.value, pageLimit);
  } catch (error) {
    toast.add({
      title: "Lỗi",
      description: "Không thể xoá handler",
      color: "error",
    });
  }
}

watch(
  () => route.query.page,
  async (newVal) => {
    page.value = newVal ? Number(newVal) : 1;
    await fetchRouteHandlers(page.value, pageLimit);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3" v-if="routeHandlers.length">
      <ULink
        v-for="handler in routeHandlers"
        :key="handler.id"
        :to="`/settings/handlers/${handler.id}`"
      >
        <UCard
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex justify-between items-start gap-4">
            <div class="space-y-1 flex-1">
              <div class="text-base font-semibold text-primary">
                {{ handler.method?.method || "Unknown method" }}
              </div>
              <div class="text-sm text-gray-400">
                Route: <code>{{ handler.route?.path || "N/A" }}</code>
              </div>
              <div
                class="text-sm text-muted-foreground"
                v-if="handler.description"
              >
                {{ handler.description }}
              </div>
            </div>

            <!-- Nút delete -->
            <div class="shrink-0">
              <UButton
                icon="lucide:trash-2"
                size="xl"
                color="error"
                @click.stop.prevent="deleteHandler(handler.id)"
              />
            </div>
          </div>
        </UCard>
      </ULink>
    </div>
    <div v-else>No records found.</div>
    <div class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
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
        v-if="page > 1"
      />
    </div>
  </div>
</template>
