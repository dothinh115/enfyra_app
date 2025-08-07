<script setup lang="ts">
import type { PermissionCondition } from "~/composables/usePermissions";

const { routes, tables, globalLoading, setSidebarVisible } = useGlobalState();
const route = useRoute();
const { isMobile, isTablet } = useScreen();
const { checkPermissionCondition } = usePermissions();
const { getMenuItemsBySidebar } = useMenuRegistry();

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

// Get current sidebar based on route
const currentSidebar = computed(() => {
  const path = route.path;
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/collections")) return "collections";
  if (path.startsWith("/data")) return "data";
  return null;
});

// Get visible menu items for current sidebar
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];

  const items = getMenuItemsBySidebar(currentSidebar.value);
  return items.filter((item) => {
    if (!item.permission) return true;
    return checkPermissionCondition(item.permission);
  });
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
      v-for="item in visibleMenuItems"
      :key="item.id"
      :condition="item.permission as any"
    >
      <UButton
        size="lg"
        variant="ghost"
        color="neutral"
        :icon="item.icon"
        :to="item.route"
        class="w-full hover:bg-primary/20"
        :class="
          route.path.startsWith(item.route) &&
          'bg-primary/20 text-white shadow hover:!bg-primary/20'
        "
        @click="handleMenuClick"
      >
        <template #trailing>
          <Icon name="lucide:arrow-right" class="ml-auto" />
        </template>
        {{ item.label }}
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
