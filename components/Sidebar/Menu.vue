<script setup lang="ts">
const { routes, tables } = useGlobalState();
const route = useRoute();
</script>

<template>
  <nav class="flex flex-col space-y-3">
    <UButton
      v-if="route.path.startsWith('/collections')"
      size="lg"
      variant="ghost"
      color="neutral"
      :to="`/collections/create`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Tạo bảng mới
    </UButton>
    <UButton
      v-for="item in tables.filter((table) =>
        routes.some((route) => route.mainTable.name === table.name)
      )"
      :key="item.id"
      size="lg"
      variant="ghost"
      color="neutral"
      :icon="item.icon"
      :to="`/collections/${item.name}`"
      v-if="route.path.startsWith('/collections')"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      {{ item.name }}
    </UButton>
  </nav>
</template>
