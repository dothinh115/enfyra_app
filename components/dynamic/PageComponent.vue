<template>
  <Transition name="loading-fade" mode="out-in">
    <CommonLoadingState
      v-if="!isMounted || loading"
      title="Loading extension..."
      description="Fetching extension component"
      size="md"
      type="table"
      context="page"
    />

    <CommonEmptyState
      v-else-if="error"
      :title="
        error.includes('disabled') ? 'Extension Disabled' : 'Extension Error'
      "
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

    <PermissionGate
      v-else-if="extensionComponent"
      :condition="menuResponse?.data[0]?.permission ?? { allowAll: true }"
    >
      <component
        :is="extensionComponent"
        :components="extensionComponent.components"
      />
    </PermissionGate>

    <CommonEmptyState
      v-else
      title="Extension Not Found"
      :description="`No extension found for route: ${props.path}`"
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
  path: string;
}

const props = defineProps<Props>();

const { isMounted } = useMounted();
const { loadDynamicComponent } = useDynamicComponent();

const error = ref<string | null>(null);
const extensionComponent = ref<any>(null);

const {
  data: menuResponse,
  error: menuError,
  pending: loading,
  execute: executeFetchMenu,
} = useApiLazy(() => "/menu_definition", {
  query: computed(() => ({
    fields: "*,extension.*",
    filter: {
      _and: [
        {
          _or: [
            { path: { _eq: props.path } },
            { path: { _eq: `/${props.path}` } },
          ],
        },
        { isEnabled: { _eq: true } },
      ],
    },
  })),
  errorContext: "Fetch Menu with Extension",
});

const loadMatchingExtension = async () => {
  error.value = null;

  await executeFetchMenu();

  // Check if there was an error
  if (menuError.value) {
    error.value = `API Error: ${menuError.value}`;
    return;
  }

  if (!menuResponse.value?.data || menuResponse.value.data.length === 0) {
    error.value = `No menu found for route: /${props.path}`;
    return;
  }

  const menuItem = menuResponse.value.data[0];

  if (!menuItem.extension || menuItem.extension.length === 0) {
    error.value = `No extension found for route: /${props.path}`;
    return;
  }

  const extension = menuItem.extension;

  if (!extension.isEnabled) {
    error.value = `Extension "${extension.name}" is currently disabled. Please contact an administrator to enable this extension.`;
    return;
  }

  try {
    const component = await loadDynamicComponent(
      extension.compiledCode || extension.code,
      extension.extensionId
    );

    extensionComponent.value = component;
  } catch (err: any) {
    error.value = `Failed to load extension: ${err?.message || err}`;
  }
};

const retry = () => {
  loadMatchingExtension();
};

// Watch for path changes
watch(
  () => props.path,
  () => {
    loadMatchingExtension();
  },
  { immediate: true }
);

onMounted(async () => {
  await loadMatchingExtension();
});
</script>