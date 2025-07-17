<template>
  <UForm
    v-if="detail"
    :state="detail"
    ref="globalForm"
    @submit="updateHook"
    class="space-y-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Icon name="lucide:zap" class="text-2xl text-primary" />
        <div class="text-xl font-bold text-primary">
          Hook: {{ detail.name || "(no name)" }}
        </div>
      </div>
      <UButton
        v-if="!detail.isSystem"
        icon="lucide:trash-2"
        size="xl"
        color="error"
        @click="deleteHook"
      />
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UBadge color="primary" v-if="detail.isSystem">System Hook</UBadge>
            <UBadge color="secondary" v-if="detail.isEnabled">Enabled</UBadge>
          </div>
        </div>
      </template>

      <DynamicFormEditor
        v-model="detail"
        :table-name="'hook_definition'"
        :excluded="['id', 'createdAt', 'updatedAt', 'isSystem']"
        :type-map="{
          isEnabled: {
            disabled: detail?.isSystem === true,
          },
          routeId: {
            componentProps: {
              disabled: detail?.isSystem === true,
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
const { confirm } = useConfirm();

const detail = ref<any>(null);
const { globalForm, globalFormLoading } = useGlobalState();

const id = route.params.id as string;

async function fetchHookDetail() {
  const { data, error } = await useApiLazy("/hook_definition", {
    query: {
      fields: "*," + "route.path," + "route.mainTable.name",
      filter: { id: { _eq: id } },
    },
  });

  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: "Không thể tải dữ liệu hook",
      color: "error",
    });
    return;
  }

  if (!data.value?.data?.[0]) {
    toast.add({
      title: "Không tìm thấy hook",
      description: "Hook không tồn tại.",
      color: "error",
    });
    router.replace("/settings/hooks");
    return;
  }

  detail.value = data.value.data[0];
}

async function updateHook() {
  globalFormLoading.value = true;

  const { data, error } = await useApiLazy(
    `/hook_definition/${detail.value.id}`,
    {
      method: "patch",
      body: detail.value,
    }
  );

  if (error.value) {
    toast.add({
      title: "Lỗi",
      description: error.value.message,
      color: "error",
    });
  } else {
    toast.add({
      title: "Đã lưu",
      description: "Hook đã được cập nhật",
      color: "primary",
    });
  }

  globalFormLoading.value = false;
}

async function deleteHook() {
  const ok = await confirm({ title: "Bạn có chắc chắn muốn xoá hook này?" });
  if (!ok || detail.value.isSystem) return;

  globalFormLoading.value = true;
  const { data, error } = await useApiLazy(`/hook_definition/${id}`, {
    method: "delete",
  });

  if (data.value) {
    toast.add({
      title: "Đã xoá",
      description: "Hook đã bị xoá",
      color: "primary",
    });
    router.push("/settings/hooks");
  } else if (error.value) {
    toast.add({
      title: "Lỗi",
      description: "Không thể xoá",
      color: "error",
    });
  }

  globalFormLoading.value = false;
}

onMounted(fetchHookDetail);
watch(() => route.params.id, fetchHookDetail);
</script>
