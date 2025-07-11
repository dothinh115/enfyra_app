<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const total = ref(0);
const route = useRoute();

async function fetchRoute(page = 1, limit: number) {
  const fields = [
    "*",
    "mainTable.*",
    "routePermissions.*",
    "handlers.*",
    "middlewares.*",
    "hooks.*",
    "publishedMethods.*",
  ].join(",");
  const sort = ["-createdAt"].join(",");

  try {
    const { data } = await useApiLazy("/route_definition", {
      query: { fields, sort, meta: "*", page, limit },
    });
    routes.value = data.value.data;
    total.value = data.value.meta.totalCount;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Cannot fetch routes...",
      color: "error",
    });
  }
}
const routes = ref<any[]>([]);

watch(
  () => route.query.page,
  async (newVal) => {
    if (!newVal) page.value = 1;
    else page.value = Number(newVal);
    await fetchRoute(page.value, pageLimit);
    console.log(routes.value);
  },
  {
    immediate: true,
  }
);

async function toggleEnabled(route: any) {
  route.isEnabled = !route.isEnabled;
  const { data } = await useApi(`/route_definition/${route.id}`, {
    method: "patch",
    body: {
      isEnabled: route.isEnabled,
    },
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-3 flex flex-col">
      <ULink
        :to="`/settings/routings/${route.id}`"
        v-for="route in routes"
        class="cursor-pointer relative z-10 cursor-pointer"
      >
        <UCard
          :key="route.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          variant="subtle"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <Icon
                :name="route.icon || 'lucide:circle'"
                class="text-xl text-primary mt-1"
              />
              <div class="space-y-1">
                <div class="flex space-x-1 items-center">
                  <span class="text-xs text-gray-400">Path:</span>
                  <div class="font-medium text-primary">{{ route.path }}</div>
                </div>
                <div class="flex space-x-1 items-center">
                  <span class="text-xs text-gray-400">Table:</span>
                  <div class="text-sm text-gray-300">
                    {{ route.mainTable.name }}
                  </div>
                </div>
                <div
                  class="flex space-x-1 items-center"
                  v-if="route.publishedMethods?.length"
                >
                  <span class="text-xs text-gray-400">Published Methods:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge
                      v-for="m in route.publishedMethods"
                      :key="m"
                      size="xs"
                      color="secondary"
                    >
                      {{ m.method }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-end">
              <USwitch
                :model-value="route.isEnabled"
                @update:model-value="toggleEnabled(route)"
                label="Is enabled"
                @click.prevent
                :disabled="route.isSystem"
                :color="route.isSystem ? 'warning' : 'primary'"
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
