<script setup lang="ts">
const route = useRoute();
const { confirm } = useConfirm();
const { logout } = useAuth();
const { tables, routes } = useGlobalState();

async function handleLogout() {
  const ok = await confirm({ content: "Are you sure you want to logout?" });
  if (ok) await logout();
}

const { checkPermissionCondition } = usePermissions();

const items = computed(() => [
  {
    label: "Dashboard",
    icon: "lucide:layout-dashboard",
    route: "/",
    show: true, // Always show dashboard
  },
  {
    label: "List",
    icon: "lucide:list",
    route: "/data",
    show: true, // Always show List menu
  },
  {
    label: "Collections",
    icon: "lucide:database",
    route: "/collections",
    show: checkPermissionCondition({
      or: [
        { route: "/table_definition", actions: ["update", "delete"] },
        { route: "/table_definition", actions: ["create"] },
      ],
    }),
  },
  {
    label: "Structure",
    icon: "lucide:settings",
    route: "/settings",
    show: checkPermissionCondition({
      or: [
        { route: "/setting_definition", actions: ["read", "update"] },
        { route: "/route_definition", actions: ["read", "update"] },
        { route: "/route_handler_definition", actions: ["read"] },
        { route: "/hook_definition", actions: ["read"] },
        { route: "/user_definition", actions: ["read"] },
        { route: "/role_definition", actions: ["read"] },
      ],
    }),
  },
]);

const isActive = (path: string) =>
  path === "/" ? route.path === path : route.path.startsWith(path);
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
