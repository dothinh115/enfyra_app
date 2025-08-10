<script setup lang="ts">
const route = useRoute();
const { confirm } = useConfirm();
const { logout } = useAuth();
const { miniSidebars } = useMenuRegistry();
const { checkPermissionCondition } = usePermissions();

async function handleLogout() {
  const ok = await confirm({ content: "Are you sure you want to logout?" });
  if (ok) await logout();
}

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
      show: true,
    }));

  return registeredItems;
});

const isActive = (path: string) => {
  // Handle dashboard route specifically
  if (path === "/dashboard") {
    return route.path === "/dashboard" || route.path === "/";
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
          :to="item.route"
          class="transition duration-200 ease-in-out w-12 h-12 flex justify-center items-center rounded-lg text-gray-300"
          :class="
            isActive(item.route)
              ? 'bg-primary text-gray-800 hover:bg-primary'
              : ''
          "
        />
      </UTooltip>
    </div>

    <!-- Bottom Section: Logout -->
    <div class="mt-auto w-full">
      <div class="py-2 w-full flex justify-center">
        <UTooltip text="Logout" placement="right">
          <UButton
            variant="ghost"
            icon="lucide:log-out"
            @click="handleLogout"
            class="transition duration-200 ease-in-out rotate-180 w-12 h-12 flex justify-center items-center rounded-lg text-gray-300 bg-red-800"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
