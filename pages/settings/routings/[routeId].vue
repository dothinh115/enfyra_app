<template>
  <UForm
    v-if="detail"
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

const detail = ref<Record<string, any> | null>(null);
const form = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});
const tableName = "route_definition";

// Load schema helpers
const { getField } = useSchema(tableName);

async function fetchRouteDetail(routeId: number) {
  const { data } = await useApiLazy("/route_definition", {
    query: {
      fields:
        "*," +
        "mainTable.*," +
        "handlers.*," +
        "hooks.*," +
        "routePermissions.*," +
        "targetTables.*",
      filter: { id: { _eq: routeId } },
    },
  });

  const routeData = data.value.data?.[0];

  if (!routeData) {
    toast.add({
      title: "Not found",
      description: "This route does not exist.",
      color: "error",
    });
    router.replace("/settings/routings");
    return;
  }

  detail.value = routeData;
  form.value = routeData;
  errors.value = {};
}

function validate(): boolean {
  let isValid = true;
  const currentErrors: Record<string, string> = { ...errors.value };

  for (const key of Object.keys(form.value)) {
    const field = getField(key);
    if (!field) continue;

    const val = form.value[key];
    const nullable = field.isNullable ?? true;

    const empty =
      val === null ||
      val === undefined ||
      (typeof val === "string" && val.trim() === "");

    if (!nullable && empty) {
      currentErrors[key] = "Trường này là bắt buộc";
      isValid = false;
    } else {
      delete currentErrors[key];
    }
  }

  errors.value = currentErrors;
  return isValid;
}

async function updateRoute() {
  const isValid = validate();
  const hasCodeError = Object.keys(errors.value).length > 0;

  if (!isValid || hasCodeError) {
    toast.add({
      title: "Có lỗi",
      description: "Vui lòng kiểm tra lại các trường bị lỗi.",
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

  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(
    `/route_definition/${route.params.routeId}`,
    { method: "delete" }
  );

  globalFormLoading.value = false;

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
}

onMounted(() => fetchRouteDetail(Number(route.params.routeId)));
watch(
  () => route.params.routeId,
  (newVal) => fetchRouteDetail(Number(newVal))
);
</script>
