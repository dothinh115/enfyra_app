<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const detail = ref<any>(null);
const form = ref<any>({});
const { settings, globalForm, globalFormLoading } = useGlobalState();
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
</script>

<template>
  <UForm v-if="detail" :state="detail" ref="globalForm" @submit="updateRoute">
    <div class="flex items-center gap-3 mb-6">
      <Icon
        :name="detail.icon || 'lucide:circle'"
        class="text-2xl text-primary"
      />
      <h1 class="text-xl font-bold text-primary">Route: {{ detail.path }}</h1>
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
          'mainTable',
          'isSystem',
          'routePermissions',
          'middlewares',
          'hooks',
          'targetTables',
        ]"
        :type-map="{
          publishedMethods: {
            type: 'array-select',
            options: settings.actionPermissionValue.map((map:any) => map.method),
            labelKey: 'method'
          },
          path: {
            disabled: true,
          },
          isEnabled: {
            disabled: detail?.isSystem === true,
          },
        }"
      />
    </UCard>
  </UForm>
</template>
