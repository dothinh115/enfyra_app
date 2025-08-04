<script setup lang="ts">
const route = useRoute();
const { confirm } = useConfirm();
const { logout } = useAuth();
async function handleLogout() {
  const ok = await confirm({ content: "Are you sure you want to logout?" });
  if (ok) await logout();
}

const items = [
  {
    label: "Dashboard",
    icon: "lucide:layout-dashboard",
    route: "/",
  },
  {
    label: "List",
    icon: "lucide:list",
    route: "/data",
  },
  {
    label: "Collections",
    icon: "lucide:database",
    route: "/collections",
  },
  {
    label: "Structure",
    icon: "lucide:settings",
    route: "/settings",
  },
];

const isActive = (path: string) =>
  path === "/" ? route.path === path : route.path.startsWith(path);
</script>

<template>
  <div class="flex flex-col h-full w-full">
    <!-- Navigation Section -->
    <div class="flex flex-col items-center w-full py-2 gap-2">
      <UTooltip
        v-for="item in items"
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
