<script setup lang="ts">
const toast = useToast();
const page = ref(1);
const pageLimit = 7;
const total = ref(0);
const route = useRoute();
const tableName = "hook_definition";
const hooks = ref<any[]>([]);
const { getIncludeFields } = useSchema(tableName);
const loading = ref(false);

async function fetchHooks(page = 1, limit: number) {
  loading.value = true;
  const { data, error } = await useApiLazy("/hook_definition", {
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
      description: "Cannot load hooks list",
      color: "error",
    });
    loading.value = false;
    return;
  }
  
  hooks.value = data.value.data;
  total.value = data.value.meta.totalCount;
  loading.value = false;
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
  await useApiLazy(`/hook_definition/${hook.id}`, {
    method: "patch",
    body: { isEnabled: hook.isEnabled },
  });
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-4">
      <div class="relative">
        <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
        <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-muted-foreground">Loading hooks...</p>
    </div>
    <div class="space-y-3 flex flex-col" v-else-if="hooks.length">
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

              <div class="flex items-center space-x-1">
                <span class="text-xs text-gray-400">Route:</span>
                <span class="text-sm text-gray-300">{{
                  hook.route?.path ?? "All path"
                }}</span>
              </div>

              <div class="flex items-center space-x-1 flex-wrap">
                <span class="text-xs text-gray-400">Methods:</span>
                <UBadge
                  color="primary"
                  size="xs"
                  variant="solid"
                  v-for="(item, index) in hook.methods"
                  :key="index"
                  v-if="hook.methods.length"
                >
                  {{ item?.method }}
                </UBadge>
                <UBadge color="primary" size="xs" variant="solid" v-else>
                  All methods
                </UBadge>
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
    <div v-else-if="!loading" class="text-center py-8 text-muted-foreground">No hooks found.</div>

    <div class="flex justify-center mt-6">
      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
        v-if="page > 1 && !loading"
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
