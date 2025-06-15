<template>
  <div class="flex h-screen text-sm bg-background text-foreground">
    <!-- Mini Sidebar -->
    <aside class="w-16 bg-background flex flex-col items-center">
      <LogoMini />
      <SidebarMiniMenu />
    </aside>

    <!-- Sidebar -->
    <aside class="w-60 bg-muted p-4 flex flex-col">
      <LogoFull class="mb-9" />
      <SidebarMenu />
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col">
      <!-- Header -->
      <header
        class="h-16 px-6 border-b border-gray-600 flex items-center justify-between bg-background"
      >
        <div class="text-lg font-semibold">
          {{
            route.path.startsWith("/collections") ? "Collections" : "Dashboard"
          }}
        </div>
        <div class="flex gap-2 items-center">
          <UButton icon="lucide:filter" label="Filter" />
          <UAvatar />
        </div>
      </header>

      <!-- Page content -->
      <section class="flex-1 overflow-auto p-6">
        <slot />
      </section>
    </main>
  </div>
  <GlobalConfirm />
</template>

<script setup lang="ts">
const route = useRoute();
const global = useGlobalState();
await Promise.all([global.fetchTable(), global.fetchRoute()]);
</script>
