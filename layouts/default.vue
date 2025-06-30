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
    <main class="flex-1 flex flex-col min-h-0">
      <!-- Header -->
      <header
        class="h-16 px-6 border-b border-gray-600 flex items-center justify-between bg-background shrink-0"
      >
        <BreadCrumbs />

        <div v-if="route.path.startsWith('/collections')">
          <UButton
            :label="
              route.path === '/collections' ? 'Tạo bảng mới' : 'Lưu thay đổi'
            "
            :icon="
              route.path === '/collections/create'
                ? 'lucide:newspaper'
                : 'lucide:save'
            "
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
        </div>
        <div v-else-if="route.path === '/settings/routings'"></div>

        <div
          v-else-if="
            route.path.startsWith('/settings') ||
            route.path.startsWith(`/data/${route.params.table}/create`) ||
            route.path.startsWith(
              `/data/${route.params.table}/${route.params.id}`
            )
          "
        >
          <UButton
            :label="'Save'"
            :icon="'lucide:newspaper'"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
        </div>
        <div
          class="flex gap-2 items-center"
          v-else-if="route.path.startsWith('/data')"
        >
          <UButton
            :icon="'lucide:plus'"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/data/${route.params.table}/create`"
          />
        </div>
      </header>

      <!-- Page content -->
      <section class="flex-1 min-h-0 overflow-auto p-6">
        <slot />
      </section>
    </main>
  </div>
  <GlobalConfirm />
</template>

<script setup lang="ts">
const route = useRoute();
const { fetchSchema, globalForm, globalFormLoading } = useGlobalState();
await fetchSchema();
</script>
