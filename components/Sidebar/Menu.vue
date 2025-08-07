<script setup lang="ts">
const { routes, tables, globalLoading, setSidebarVisible } = useGlobalState();
const route = useRoute();
const { isMobile, isTablet } = useScreen();
const { checkPermissionCondition } = usePermissions();

function handleMenuClick() {
  if (isMobile.value || isTablet.value) {
    setSidebarVisible(false);
  }
}

// Check if user has permission for any table
const hasAnyTablePermission = computed(() => {
  const availableTables = tables.value.filter((table) =>
    routes.value.some(
      (route) => table.name === route.mainTable?.name && !table.isSystem
    )
  );

  return availableTables.some((table) =>
    checkPermissionCondition({
      or: [{ route: `/${table.name}`, actions: ["read"] }],
    })
  );
});
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
    <PermissionGate
      :condition="{
        or: [{ route: '/table_definition', actions: ['create'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="`/collections`"
        class="w-full hover:bg-primary/20"
        active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Create New Table
      </UButton>
    </PermissionGate>
    <PermissionGate
      v-for="item in tables"
      :key="item.id"
      :condition="{
        or: [{ route: '/table_definition', actions: ['update', 'delete'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :icon="item.icon"
        :to="`/collections/${item.name}`"
        class="w-full hover:bg-primary/20"
        active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        <span class="truncate">{{ item.name }}</span>
      </UButton>
    </PermissionGate>
  </nav>
  <nav
    v-else-if="route.path.startsWith('/settings')"
    class="flex flex-col space-y-3"
  >
    <PermissionGate
      :condition="{
        or: [{ route: '/setting_definition', actions: ['read', 'update'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="`/settings/general`"
        class="w-full hover:bg-primary/20"
        active-class="bg-primary/20 text-white shadow hover:!bg-primary/20"
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        General
      </UButton>
    </PermissionGate>
    <PermissionGate
      :condition="{
        or: [{ route: '/route_definition', actions: ['read', 'update'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="{
          name: 'settings-routings',
        }"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith('/settings/routings') &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Routings
      </UButton>
    </PermissionGate>
    <PermissionGate
      :condition="{
        or: [{ route: '/route_handler_definition', actions: ['read'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="{
          name: 'settings-handlers',
        }"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith('/settings/handlers') &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Handlers
      </UButton>
    </PermissionGate>
    <PermissionGate
      :condition="{
        or: [{ route: '/hook_definition', actions: ['read'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="{
          name: 'settings-hooks',
        }"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith('/settings/hooks') &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Hooks
      </UButton>
    </PermissionGate>
    <PermissionGate
      :condition="{
        or: [{ route: '/user_definition', actions: ['read'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="{
          name: 'settings-users',
        }"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith('/settings/users') &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Users
      </UButton>
    </PermissionGate>
    <PermissionGate
      :condition="{
        or: [{ route: '/role_definition', actions: ['read'] }],
      }"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :to="{
          name: 'settings-roles',
        }"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith('/settings/roles') &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        Roles
      </UButton>
    </PermissionGate>
  </nav>
  <nav
    v-else-if="route.path.startsWith('/data')"
    class="flex flex-col space-y-3"
  >
    <template
      v-if="
        tables.filter((table) =>
          routes.some(
            (route) => table.name === route.mainTable.name && !table.isSystem
          )
        ).length === 0
      "
    >
      <div
        class="flex flex-col items-center justify-center py-8 px-4 text-center"
      >
        <Icon
          name="lucide:database-off"
          class="w-8 h-8 text-muted-foreground mb-2"
        />
        <p class="text-sm text-muted-foreground">No data tables available</p>
        <p class="text-xs text-muted-foreground mt-1">
          Contact your administrator to get access
        </p>
      </div>
    </template>
    <template v-else>
      <PermissionGate
        v-for="item in tables.filter((table) =>
          routes.some(
            (route) => table.name === route.mainTable.name && !table.isSystem
          )
        )"
        :key="item.id"
        :condition="{
          or: [{ route: `/${item.name}`, actions: ['read'] }],
        }"
      >
        <UButton
          size="lg"
          variant="ghost"
          color="neutral"
          :icon="item.icon"
          :to="`/data/${item.name}`"
          class="w-full hover:bg-primary/20"
          :class="
            route.path.startsWith(`/data/${item.name}`) &&
            'bg-primary/20 text-white shadow hover:!bg-primary/20'
          "
          @click="handleMenuClick"
        >
          <template #trailing>
            <Icon name="lucide:arrow-right" class="ml-auto" />
          </template>
          <span class="truncate">{{ item.name }}</span>
        </UButton>
      </PermissionGate>

      <!-- Show message if no tables are visible due to permissions -->
      <div
        v-if="!hasAnyTablePermission"
        class="flex flex-col items-center justify-center py-8 px-4 text-center"
      >
        <Icon name="lucide:lock" class="w-8 h-8 text-muted-foreground mb-2" />
        <p class="text-sm text-muted-foreground">No accessible data tables</p>
        <p class="text-xs text-muted-foreground mt-1">
          You don't have permission to view any data
        </p>
      </div>
    </template>
  </nav>
</template>
