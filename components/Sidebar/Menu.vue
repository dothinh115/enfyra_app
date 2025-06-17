<script setup lang="ts">
const { routes, tables } = useGlobalState();
const route = useRoute();
</script>

<template>
  <nav
    class="flex flex-col space-y-3"
    v-if="route.path.startsWith('/collections')"
  >
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="`/collections`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Tạo bảng mới
    </UButton>
    <UButton
      v-for="item in routes.filter((route) =>
        tables.some((table) => route.mainTable.name === table.name)
      )"
      :key="item.id"
      size="lg"
      variant="ghost"
      color="neutral"
      :icon="item.icon"
      :to="`/collections/${item.mainTable.name}`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      {{ item.path }}
    </UButton>
  </nav>
  <nav
    v-else-if="route.path.startsWith('/settings')"
    class="flex flex-col space-y-3"
  >
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="`/settings`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white  shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Settings
    </UButton>
  </nav>
</template>
