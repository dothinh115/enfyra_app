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
      active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Tạo bảng mới
    </UButton>
    <UButton
      v-for="item in tables.filter((table) =>
        routes.some((route) => table.name === route.mainTable.name)
      )"
      :key="item.id"
      size="lg"
      variant="ghost"
      color="neutral"
      :icon="item.icon"
      :to="`/collections/${item.name}`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      {{ item.name }}
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
      :to="`/settings/general`"
      class="hover:bg-primary/20"
      active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      General
    </UButton>
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="{
        name: 'settings-routings',
      }"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith('/settings/routings') &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Routings
    </UButton>
  </nav>
  <nav
    v-else-if="route.path.startsWith('/data')"
    class="flex flex-col space-y-3"
  >
    <UButton
      v-for="item in tables.filter((table) =>
        routes.some(
          (route) => table.name === route.mainTable.name && !table.isSystem
        )
      )"
      :key="item.id"
      size="lg"
      variant="ghost"
      color="neutral"
      :icon="item.icon"
      :to="`/data/${item.name}`"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith(`/data/${item.name}`) &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      {{ item.name }}
    </UButton>
  </nav>
</template>
