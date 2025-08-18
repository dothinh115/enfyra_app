<script setup lang="ts">
const route = useRoute();
const { miniSidebars, bottomMiniSidebars } = useMenuRegistry();
const { checkPermissionCondition } = usePermissions();

const items = computed(() => {
  // Use only registered mini sidebars - Dashboard will be registered in extension
  const registeredItems = miniSidebars.value
    .filter((sidebar) => {
      if (!sidebar.permission) return true;
      return checkPermissionCondition(sidebar.permission);
    })
    .map((sidebar) => ({
      label: sidebar.label,
      icon: sidebar.icon,
      route: sidebar.route,
      onClick: sidebar.onClick,
      class: sidebar.class,
      show: true,
      hasRoute: !!sidebar.route,
    }));

  return registeredItems;
});

const bottomItems = computed(() => {
  // Process bottom mini sidebars
  const registeredBottomItems = bottomMiniSidebars.value
    .filter((sidebar) => {
      if (!sidebar.permission) return true;
      return checkPermissionCondition(sidebar.permission);
    })
    .map((sidebar) => ({
      label: sidebar.label,
      icon: sidebar.icon,
      route: sidebar.route,
      onClick: sidebar.onClick,
      class: sidebar.class,
      show: true,
      hasRoute: !!sidebar.route,
    }));

  return registeredBottomItems;
});

const isActive = (path: string | undefined) => {
  if (!path) return false;
  
  // Handle dashboard route specifically
  if (path === "/dashboard") {
    return (
      route.path === "/dashboard" ||
      route.path === "/" ||
      route.path.startsWith("/dashboard/")
    );
  }

  // For other routes, check if current path starts with item route
  return route.path.startsWith(path);
};
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <!-- Navigation Section -->
    <div class="flex flex-col items-center w-full py-2 gap-2">
      <UTooltip
        v-for="item in items.filter((item) => item.show)"
        :key="item.icon"
        :text="item.label"
        placement="right"
        :delay-duration="0"
      >
        <UButton
          variant="ghost"
          :icon="item.icon"
          :to="item.hasRoute ? item.route : undefined"
          @click="item.onClick"
          class="transition duration-200 ease-in-out w-12 h-12 flex justify-center items-center rounded-lg text-gray-300"
          :class="[
            isActive(item.route)
              ? 'bg-primary text-gray-800 hover:bg-primary'
              : '',
            item.class || ''
          ]"
        />
      </UTooltip>
    </div>

    <!-- Bottom Section: Bottom Items -->
    <div class="mt-auto w-full">
      <div v-if="bottomItems.length > 0" class="flex flex-col items-center w-full py-2 gap-2">
        <UTooltip
          v-for="item in bottomItems.filter((item) => item.show)"
          :key="item.icon"
          :text="item.label"
          placement="right"
          :delay-duration="0"
        >
          <UButton
            variant="ghost"
            :icon="item.icon"
            :to="item.hasRoute ? item.route : undefined"
            @click="item.onClick"
            class="transition duration-200 ease-in-out w-12 h-12 flex justify-center items-center rounded-lg text-gray-300"
            :class="[
              isActive(item.route)
                ? 'bg-primary text-gray-800 hover:bg-primary'
                : '',
              item.class || ''
            ]"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
