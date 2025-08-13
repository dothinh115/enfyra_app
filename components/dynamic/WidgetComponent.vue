<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading widget..."
      description="Fetching widget component"
      size="md"
      type="table"
      context="inline"
    />

    <CommonEmptyState
      v-else-if="error"
      :title="error.includes('disabled') ? 'Widget Disabled' : 'Widget Error'"
      :description="error"
      :icon="
        error.includes('disabled')
          ? 'i-heroicons-lock-closed'
          : 'i-heroicons-exclamation-triangle'
      "
      size="md"
      :action="
        error.includes('disabled')
          ? {
              label: 'Go to Extension Settings',
              onClick: async () => {
                await navigateTo('/settings/extensions');
              },
              icon: 'i-heroicons-cog-6-tooth',
            }
          : {
              label: 'Retry',
              onClick: retry,
              icon: 'i-heroicons-arrow-path',
            }
      "
    />

    <component
      v-else-if="widgetComponent"
      :is="widgetComponent"
      :components="widgetComponent.components"
      v-bind="$attrs"
    />

    <CommonEmptyState
      v-else
      title="Widget Not Found"
      :description="`No widget found with ID: ${props.id}`"
      icon="i-heroicons-puzzle-piece"
      size="md"
      :action="{
        label: 'Browse Extensions',
        onClick: async () => {
          await navigateTo('/settings/extensions');
        },
        icon: 'i-heroicons-cog-6-tooth',
      }"
    />
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  id: string | number;
}

const props = defineProps<Props>();

// Inherit attrs to pass through to loaded component
defineOptions({
  inheritAttrs: false
});

const { isMounted } = useMounted();
const { loadDynamicComponent } = useDynamicComponent();

const error = ref<string | null>(null);
const widgetComponent = ref<any>(null);

const {
  data: extensionResponse,
  error: extensionError,
  pending: loading,
  execute: executeFetchExtension,
} = useApiLazy(() => "/extension_definition", {
  query: computed(() => ({
    fields: "*",
    filter: {
      _and: [
        { id: { _eq: props.id } },
        { isEnabled: { _eq: true } },
        { type: { _eq: "widget" } },
      ],
    },
  })),
  errorContext: "Fetch Widget Extension",
});

const loadMatchingWidget = async () => {
  error.value = null;

  await executeFetchExtension();

  // Check if there was an error
  if (extensionError.value) {
    error.value = `API Error: ${extensionError.value}`;
    return;
  }

  if (!extensionResponse.value?.data || extensionResponse.value.data.length === 0) {
    error.value = `No widget found with ID: ${props.id}`;
    return;
  }

  const extension = extensionResponse.value.data[0];

  if (!extension.isEnabled) {
    error.value = `Widget "${extension.name}" is currently disabled. Please contact an administrator to enable this widget.`;
    return;
  }

  try {
    const component = await loadDynamicComponent(
      extension.code,
      extension.extensionId
    );

    widgetComponent.value = component;
  } catch (err: any) {
    error.value = `Failed to load widget: ${err?.message || err}`;
  }
};

const retry = () => {
  loadMatchingWidget();
};

// Watch for id changes
watch(
  () => props.id,
  () => {
    loadMatchingWidget();
  },
  { immediate: true }
);

onMounted(async () => {
  await loadMatchingWidget();
});
</script>
