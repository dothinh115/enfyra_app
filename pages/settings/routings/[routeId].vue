<template>
  <UForm
    v-if="detail"
    :state="detail"
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

      <DynamicFormEditor
        v-model="detail"
        :table-name="'route_definition'"
        :excluded="[
          'id',
          'createdAt',
          'updatedAt',
          'isSystem',
          'routePermissions',
          'middlewares',
        ]"
        :type-map="{
          path: {
            disabled: detail?.isSystem === true,
          },
          isEnabled: {
            disabled: detail?.isSystem === true,
          },
          handlers: {
            componentProps: {
              allowDelete: true,
            },
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

const detail = ref<any>(null);
const form = ref<any>({});
const { globalForm, globalFormLoading } = useGlobalState();
const { confirm } = useConfirm();
async function fetchRouteDetail(routeId: number) {
  try {
    const { data } = await useApiLazy("/route_definition", {
      query: {
        fields:
          "*," +
          "mainTable.*," +
          "handlers.*," +
          "middlewares.*," +
          "hooks.*," +
          "routePermissions.*," +
          "targetTables.*",
        filter: {
          id: {
            _eq: routeId,
          },
        },
      },
    });
    detail.value = data.value.data?.[0];
    if (!detail.value) {
      toast.add({
        title: "Not found",
        description: "This route does not exist.",
        color: "error",
      });
      router.replace("/settings/routings");
      return;
    }
    form.value = detail.value;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Cannot fetch route.",
      color: "error",
    });
  }
}

async function updateRoute() {
  globalFormLoading.value = true;
  try {
    await useApiLazy(`/route_definition/${detail.value.id}`, {
      method: "patch",
      body: form.value,
    });
    toast.add({
      title: "Saved",
      description: "Route updated",
      color: "primary",
    });
  } catch (err) {
    toast.add({ title: "Error", description: "Update failed", color: "error" });
  } finally {
    globalFormLoading.value = false;
  }
}

onMounted(async () => {
  await fetchRouteDetail(Number(route.params.routeId));
});
watch(
  () => route.params.routeId,
  async (newVal) => {
    await fetchRouteDetail(Number(newVal));
  }
);

async function deleteRoute() {
  const ok = await confirm({
    title: "Are you sure?",
  });
  if (!ok || detail.value.isSystem) return;
  globalFormLoading.value = true;
  const { data, error } = await useApiLazy(
    `/route_definition/${route.params.routeId}`,
    {
      method: "delete",
    }
  );
  if (data.value) {
    toast.add({
      title: "Saved",
      description: "Route updated",
      color: "primary",
    });
    router.push("/settings/routings");
  }
  if (error.value) {
    toast.add({ title: "Error", description: "Delete failed", color: "error" });
  }
  globalFormLoading.value = false;
}
</script>
