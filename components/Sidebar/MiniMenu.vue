<script setup lang="ts">
const route = useRoute();
const { confirm } = useConfirm();
const { logout } = useAuth();
async function handleLogout() {
  const ok = await confirm({ content: "Bạn chắc chắn muốn thoát?" });
  if (ok) await logout();
}

const items = [
  { icon: "lucide:layout-dashboard", tooltip: "Dashboard", to: "/" },
  { icon: "lucide:database", tooltip: "CMS", to: "/cms" },
  { icon: "lucide:image", tooltip: "Media", to: "/media" },
  { icon: "lucide:settings", tooltip: "Settings", to: "/settings" },
];

const isActive = (path: string) => route.path.startsWith(path);
</script>

<template>
  <div class="flex flex-col justify-between h-full items-center w-full">
    <!-- Tầng trên: Menu chính -->
    <div class="flex flex-col items-center w-full">
      <UTooltip
        v-for="item in items"
        :key="item.icon"
        :text="item.tooltip"
        placement="right"
      >
        <UButton
          variant="ghost"
          :icon="item.icon"
          color="primary"
          class="w-full aspect-square flex justify-center items-center transition duration-200 ease-in-out rounded-none"
          :class="
            isActive(item.to)
              ? 'bg-primary text-gray-800 hover:bg-primary'
              : 'hover:bg-gray-800'
          "
        />
      </UTooltip>
    </div>

    <!-- Tầng dưới: Logout -->
    <div class="w-full">
      <UTooltip text="Logout" placement="right">
        <UButton
          variant="ghost"
          icon="lucide:log-out"
          @click="handleLogout"
          class="transition duration-200 ease-in-out rotate-180 w-full aspect-square flex justify-center bg-red-900 hover:bg-red-700 rounded-none text-gray-100"
        />
      </UTooltip>
    </div>
  </div>
</template>
