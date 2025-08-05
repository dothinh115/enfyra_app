<template>
  <!-- Loading state -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
    <div class="relative">
      <div class="w-12 h-12 border-4 border-primary/20 rounded-full"></div>
      <div class="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
    </div>
    <p class="text-sm text-muted-foreground">Loading route...</p>
  </div>

  <!-- Form content -->
  <UForm
    v-else-if="detail"
    :state="form"
    ref="globalForm"
    @submit="updateRoute"
    class="space-y-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon
          :name="detail.icon || 'lucide:circle'"
          class="text-2xl text-primary"
        />
        <div class="text-xl font-bold text-primary">
          Route: {{ detail.path }}
        </div>
      </div>
      <UButton
        v-if="detail?.isSystem === false"
        icon="lucide:trash-2"
        size="xl"
        color="error"
        :loading="createButtonLoader('delete-route').isLoading.value"
        @click="deleteRoute"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UBadge color="primary" v-if="form.isSystem">System Route</UBadge>
            <UBadge color="secondary" v-if="form.isEnabled">Enabled</UBadge>
          </div>
        </div>
      </template>

      <FormEditor
        v-model="form"
        v-model:errors="errors"
        :table-name="tableName"
        :excluded="[
          'id',
          'createdAt',
          'updatedAt',
          'isSystem',
          'routePermissions',
          'middlewares',
        ]"
        :type-map="{
          path: { disabled: detail?.isSystem },
          isEnabled: { disabled: detail?.isSystem },
          handlers: {
            componentProps: { allowDelete: true },
          },
        }"
      />
    </UCard>
  </UForm>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();
const { globalForm, globalFormLoading } = useGlobalState();
const { createButtonLoader } = useButtonLoading();

const tableName = "route_definition";
const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const loading = ref(false);

const { validate, getIncludeFields } = useSchema(tableName);

async function fetchRouteDetail(routeId: number) {
  loading.value = true;
  
  const { data, error } = await useApiLazy("/route_definition", {
    query: {
      fields: getIncludeFields(),
      filter: { id: { _eq: routeId } },
    },
  });

  if (error.value || !data.value?.data?.[0]) {
    toast.add({
      title: "Not found",
      description: "This route does not exist.",
      color: "error",
    });
    router.replace("/settings/routings");
    loading.value = false;
    return;
  }

  detail.value = data.value.data[0];
  form.value = { ...detail.value };
  errors.value = {};
  loading.value = false;
}

async function updateRoute() {
  const { isValid, errors: validationErrors } = validate(form.value);

  if (!isValid) {
    errors.value = validationErrors;
    toast.add({
      title: "Error",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  globalFormLoading.value = true;

  const { error } = await useApiLazy(`/route_definition/${detail.value?.id}`, {
    method: "patch",
    body: form.value,
  });

  globalFormLoading.value = false;

  if (error.value) {
    toast.add({
      title: "Error",
      description: error.value.message,
      color: "error",
    });
    return;
  }

  toast.add({
    title: "Saved",
    description: "Route updated",
    color: "primary",
  });
}

async function deleteRoute() {
  const ok = await confirm({ title: "Are you sure?" });
  if (!ok || detail.value?.isSystem) return;

  const deleteLoader = createButtonLoader('delete-route');
  await deleteLoader.withLoading(async () => {
    const { data, error } = await useApiLazy(
      `/route_definition/${route.params.routeId}`,
      { method: "delete" }
    );

    if (error.value) {
      toast.add({ title: "Error", description: "Delete failed", color: "error" });
      return;
    }

    toast.add({
      title: "Deleted",
      description: "Route has been removed.",
      color: "primary",
    });

    router.push("/settings/routings");
  });
}

onMounted(() => fetchRouteDetail(Number(route.params.routeId)));
watch(
  () => route.params.routeId,
  (newVal) => fetchRouteDetail(Number(newVal))
);
</script>
