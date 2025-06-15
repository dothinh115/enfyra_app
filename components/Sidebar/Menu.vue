<script setup lang="ts">
const { routes } = useGlobalState();
const route = useRoute();

watch(
  () => route.path,
  (newVal) => {
    if (newVal.startsWith("/collections") && !route.params.table)
      return navigateTo(`/collections/${routes.value[0].mainTable.name}`, {
        replace: true,
      });
  }
);
</script>

<template>
  <nav class="flex flex-col space-y-3">
    <UButton
      v-for="item in routes"
      :key="item.id"
      size="lg"
      variant="ghost"
      color="neutral"
      :icon="item.icon"
      :to="`/collections/${item.mainTable.name}`"
      v-if="route.path.startsWith('/collections')"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      {{ item.path.replace(/^\//, "") }}
    </UButton>
  </nav>
</template>
