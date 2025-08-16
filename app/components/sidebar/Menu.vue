<script setup lang="ts">
const { globalLoading, setSidebarVisible } = useGlobalState();
const route = useRoute();
const { isMobile, isTablet } = useScreen();
const { getMenuItemsBySidebar, miniSidebars } = useMenuRegistry();

function handleMenuClick() {
  if (isMobile.value || isTablet.value) {
    setSidebarVisible(false);
  }
}

// Function to check if item is active
const isItemActive = (itemRoute: string) => {
  const currentPath = route.path;

  // If item route is exactly '/collections', only active when current path is exactly '/collections'
  if (itemRoute === "/collections") {
    return currentPath === "/collections";
  }

  // For other routes, check if current path starts with item route
  return currentPath.startsWith(itemRoute);
};

// Get current sidebar based on registered mini sidebars
const currentSidebar = computed(() => {
  const path = route.path;
  const matchingSidebar = miniSidebars.value.find((sidebar) => {
    return path.startsWith(sidebar.route);
  });
  return matchingSidebar?.id ? Number(matchingSidebar.id) : null;
});

// Get visible menu items for current sidebar
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];

  const items = getMenuItemsBySidebar(currentSidebar.value);

  // Return all items, let PermissionGate handle permission checking
  return items;
});
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="globalLoading" class="flex flex-col space-y-3">
    <div v-for="i in 5" :key="i" class="animate-pulse">
      <div class="h-10 bg-muted/50 rounded-lg"></div>
    </div>
  </div>

  <!-- Menu items based on registry -->
  <nav v-else class="flex flex-col space-y-3">
    <!-- Empty state when no menu items available -->
    <template v-if="visibleMenuItems.length === 0">
      <div
        class="flex flex-col items-center justify-center py-8 px-4 text-center"
      >
        <UIcon name="lucide:list" class="w-8 h-8 text-muted-foreground mb-2" />
        <p class="text-sm text-muted-foreground">No menu items available</p>
        <p class="text-xs text-muted-foreground mt-1">
          Contact your administrator to get access
        </p>
      </div>
    </template>

    <!-- Render menu items -->
    <template v-else>
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
            isItemActive(item.route) &&
            'bg-primary/20 text-white shadow hover:!bg-primary/20'
          "
          @click="handleMenuClick"
        >
          <template #trailing>
            <UIcon name="lucide:arrow-right" class="ml-auto" />
          </template>
          <span class="truncate">{{ item.label }}</span>
        </UButton>
      </PermissionGate>
    </template>
  </nav>
</template>
