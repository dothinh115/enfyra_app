<script setup lang="ts">
import { useApiLazyWithError } from "~/composables/useApiWithError";

const toast = useToast();
const page = ref(1);
const pageLimit = 10;
const total = ref(0);
const routeHandlers = ref<any[]>([]);
const route = useRoute();
const tableName = "route_handler_definition";
const { confirm } = useConfirm();
const { getIncludeFields } = useSchema(tableName);
const loading = ref(false);

async function fetchRouteHandlers(page = 1, limit = 10) {
  loading.value = true;
  const { data, error } = await useApiLazyWithError(
    "/route_handler_definition",
    {
      query: {
        fields: getIncludeFields(),
        sort: "-createdAt",
        meta: "*",
        page,
        limit,
      },
      errorContext: "Fetch Route Handlers",
    }
  );

  if (error.value) {
    toast.add({
      title: "Error",
      description: "Cannot load route handlers list",
      color: "error",
    });
    loading.value = false;
    return;
  }

  routeHandlers.value = data.value.data;
  total.value = data.value.meta.totalCount;
  loading.value = false;
}

async function deleteHandler(id: number) {
  const ok = await confirm({
    title: "Are you sure?",
  });
  if (!ok) return;

  const { error } = await useApiLazyWithError(
    `/route_handler_definition/${id}`,
    {
      method: "delete",
      errorContext: "Delete Handler",
    }
  );

  if (error.value) {
    toast.add({
      title: "Error",
      description: "Cannot delete handler",
      color: "error",
    });
    return;
  }

  toast.add({ title: "Deleted", color: "success" });
  await fetchRouteHandlers(page.value, pageLimit);
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
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-16 gap-4"
    >
      <div class="relative">
        <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
        <div
          class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"
        ></div>
      </div>
      <p class="text-sm text-muted-foreground">Loading handlers...</p>
    </div>
    <div class="space-y-3" v-else-if="routeHandlers.length">
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

            <!-- Delete button -->
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
    <div v-else-if="!loading">No records found.</div>
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
        v-if="page > 1 && !loading"
      />
    </div>
  </div>
</template>
