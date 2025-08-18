<script setup lang="ts">
const { globalLoading, setSidebarVisible } = useGlobalState();
const route = useRoute();
const { isMobile, isTablet } = useScreen();
const { getMenuItemsBySidebar, miniSidebars } = useMenuRegistry();

// Expanded state for collapsible menu items
const expandedItems = ref<Set<string>>(new Set());

function handleMenuClick() {
  if (isMobile.value || isTablet.value) {
    setSidebarVisible(false);
  }
}

// Toggle expand/collapse for menu items with children
function toggleExpanded(itemId: string | number) {
  const id = String(itemId);
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
}

// Check if menu item is expanded
function isExpanded(itemId: string | number) {
  return expandedItems.value.has(String(itemId));
}

// Check if menu item has children
function hasChildren(item: any) {
  return item.children && item.children.length > 0;
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
    return sidebar.route && path.startsWith(sidebar.route);
  });
  return matchingSidebar?.id ? Number(matchingSidebar.id) : null;
});

// Get visible menu items for current sidebar
const visibleMenuItems = computed(() => {
  if (!currentSidebar.value) return [];

  // Use registry data (now includes children)
  const items = getMenuItemsBySidebar(currentSidebar.value);
  return items;
});
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="globalLoading" class="flex flex-col space-y-1">
    <div v-for="i in 5" :key="i" class="animate-pulse">
      <div class="h-10 bg-muted/50 rounded-lg"></div>
    </div>
  </div>

  <!-- Menu items based on registry -->
  <nav v-else class="flex flex-col space-y-1">
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
      <div
        v-for="(item, index) in visibleMenuItems"
        :key="item.id"
        class="space-y-1"
      >
        <PermissionGate :condition="item.permission as any">
          <!-- Menu item with children (collapsible) -->
          <div
            v-if="
              item.type === 'Dropdown Menu' ||
              (item.type === 'Menu' && hasChildren(item))
            "
            :class="[
              'border-gray-600 py-1',
              index !== 0 && 'border-t',
              index !== visibleMenuItems.length - 1 && 'border-b',
            ]"
          >
            <UButton
              size="lg"
              variant="ghost"
              color="neutral"
              :icon="item.icon"
              class="w-full hover:text-primary bg-transparent hover:bg-transparent active:bg-transparent mb-1"
              @click="toggleExpanded(item.id)"
            >
              <template #trailing>
                <UIcon
                  :name="
                    isExpanded(item.id)
                      ? 'lucide:chevron-down'
                      : 'lucide:chevron-right'
                  "
                  class="ml-auto transition-transform duration-200"
                />
              </template>
              <span class="truncate">{{ item.label }}</span>
            </UButton>

            <!-- Children items - only show if there are children -->
            <div
              v-if="hasChildren(item) && isExpanded(item.id)"
              class="ml-3 space-y-1 relative"
            >
              <!-- Vertical line connecting parent to children -->
              <div
                class="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-400/40 rounded-full"
              ></div>

              <PermissionGate
                v-for="child in item.children"
                :key="child.id"
                :condition="child.permission as any"
              >
                <UButton
                  size="md"
                  variant="ghost"
                  color="neutral"
                  :icon="child.icon"
                  :to="child.path || child.route"
                  class="w-full text-sm relative pl-4 hover:text-primary bg-transparent hover:bg-transparent active:bg-transparent"
                  :class="
                    isItemActive(child.path || child.route) &&
                    'font-extrabold text-primary'
                  "
                  @click="handleMenuClick"
                >
                  <!-- Horizontal line connecting to vertical line -->

                  <span class="truncate">{{ child.label }}</span>
                </UButton>
              </PermissionGate>
            </div>
          </div>

          <!-- Regular menu item (link) -->
          <UButton
            v-else
            size="lg"
            variant="ghost"
            color="neutral"
            :icon="item.icon"
            :to="item.path || item.route"
            class="w-full hover:text-primary bg-transparent hover:bg-transparent active:bg-transparent"
            :class="
              isItemActive(item.path || item.route) &&
              'font-extrabold text-primary'
            "
            @click="handleMenuClick"
          >
            <span class="truncate">{{ item.label }}</span>
          </UButton>
        </PermissionGate>
      </div>
    </template>
  </nav>
</template>
