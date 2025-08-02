<script setup lang="ts">
const { routes, tables, globalLoading } = useGlobalState();
const route = useRoute();
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="globalLoading" class="flex flex-col space-y-3">
    <div v-for="i in 5" :key="i" class="animate-pulse">
      <div class="h-10 bg-muted/50 rounded-lg"></div>
    </div>
  </div>

  <!-- Collections menu -->
  <nav
    v-else-if="route.path.startsWith('/collections')"
    class="flex flex-col space-y-3"
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
      Create New Table
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
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="{
        name: 'settings-handlers',
      }"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith('/settings/handlers') &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Handlers
    </UButton>
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="{
        name: 'settings-hooks',
      }"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith('/settings/hooks') &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Hooks
    </UButton>
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="{
        name: 'settings-users',
      }"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith('/settings/users') &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Users
    </UButton>
    <UButton
      size="lg"
      variant="ghost"
      color="neutral"
      :to="{
        name: 'settings-roles',
      }"
      class="hover:bg-primary/20"
      :class="
        route.path.startsWith('/settings/roles') &&
        'bg-primary/20 text-white shadow hover:!bg-primary/20'
      "
    >
      <template #trailing>
        <Icon name="lucide:arrow-right" class="ml-auto" />
      </template>
      Roles
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
