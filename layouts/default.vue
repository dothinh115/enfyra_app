<template>
  <div class="flex h-screen text-sm bg-background text-foreground">
    <!-- Mini Sidebar -->
    <aside class="w-16 bg-gray-900 flex flex-col items-center">
      <!-- Top Section: Toggle Button -->
      <div class="py-4 bg-gray-800 w-full flex justify-center border-b border-gray-700">
        <UTooltip :text="sidebarVisible ? 'Hide Menu' : 'Show Menu'" placement="right">
          <UButton
            variant="ghost"
            :icon="sidebarVisible ? 'lucide:panel-left-close' : 'lucide:panel-left-open'"
            @click="toggleSidebar"
            class="transition duration-200 ease-in-out w-12 h-12 flex justify-center items-center rounded-lg text-gray-300 hover:bg-gray-600 hover:text-white"
            :class="sidebarVisible ? 'bg-gray-700' : 'bg-gray-600'"
          />
        </UTooltip>
      </div>
      
      <!-- Middle Section: Navigation -->
      <div class="flex-1 w-full bg-gray-800">
        <SidebarMiniMenu />
      </div>
    </aside>

    <!-- Sidebar -->
    <aside 
      v-if="sidebarVisible" 
      class="w-60 bg-muted p-4 flex flex-col transition-all duration-300"
    >
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

        <!-- Action Buttons -->
        <div v-if="route.path.startsWith('/collections')">
          <UButton
            :label="
              route.path === '/collections' ? 'Create New Table' : 'Save Changes'
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
        <div v-else-if="route.path.startsWith('/settings/routings')">
          <UButton
            v-if="
              route.path.startsWith('/settings/routings/create') ||
              route.path.startsWith(
                `/settings/routings/${route.params.routeId}`
              )
            "
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/settings/routings/create`"
          />
        </div>
        <div v-else-if="route.path.startsWith('/settings/hooks')">
          <UButton
            v-if="
              route.path.startsWith('/settings/hooks/create') ||
              route.path.startsWith(`/settings/hooks/${route.params.id}`)
            "
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/settings/hooks/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/handlers')"
          class="flex gap-2 items-center"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/handlers/create') ||
              route.path.startsWith(`/settings/handlers/${route.params.id}`)
            "
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/settings/handlers/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/users')"
          class="flex gap-2 items-center"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/users/create') ||
              route.path.startsWith(`/settings/users/${route.params.id}`)
            "
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/settings/users/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/roles')"
          class="flex gap-2 items-center"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/roles/create') ||
              route.path.startsWith(`/settings/roles/${route.params.id}`)
            "
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/settings/roles/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/general')"
          class="flex gap-2 items-center"
        >
          <UButton
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            label="Save"
            @click="globalForm?.submit()"
          />
        </div>
        <div v-else-if="route.path.startsWith(`/data`)">
          <UButton
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/data/${route.params.table}/create`"
            v-if="route.path === `/data/${route.params.table}`"
          />
          <UButton
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            v-else-if="
              route.path.startsWith(`/data/${route.params.table}/create`) ||
              route.path.startsWith(
                `/data/${route.params.table}/${route.params.id}`
              )
            "
          />
        </div>
      </header>

      <div
        class="h-12 px-6 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
      >
        <slot name="subheader">
          <!-- Fallback content if no slot -->
          <div class="flex items-center gap-3">
            <UButton
              icon="lucide:arrow-left"
              variant="soft"
              color="primary"
              @click="$router.back()"
              label="Back"
              :disabled="disableBack"
            />
          </div>
        </slot>
      </div>

      <!-- Page Content -->
      <section class="flex-1 min-h-0 overflow-auto p-6">
        <slot />
      </section>
    </main>
  </div>

  <!-- Confirm Modal -->
  <div id="others-overlay"></div>

  <GlobalConfirm />
  <GlobalLoading
    :show="globalLoading"
    title="Processing Schema"
    description="This may take a moment due to server latency"
  />
  <RouteLoading :show="routeLoading" message="Navigating..." />
</template>

<script setup lang="ts">
const route = useRoute();
const {
  fetchSchema,
  globalForm,
  globalFormLoading,
  globalLoading,
  routeLoading,
  sidebarVisible,
  toggleSidebar,
} = useGlobalState();
// Calculate breadcrumb segments from route
const segments = computed(() => {
  const parts = route.path.split("/").filter(Boolean);

  return parts.map((part, i) => {
    const label = decodeURIComponent(part);
    const icon = "lucide:chevron-right";
    const to = "/" + parts.slice(0, i + 1).join("/");
    return { label, icon, to };
  });
});

// Disable back button if only 1 segment (root)
const disableBack = computed(() => segments.value.length <= 1);

await fetchSchema();
</script>
