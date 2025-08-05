<template>
  <div class="flex h-screen text-sm bg-background text-foreground">
    <!-- Mini Sidebar -->
    <aside class="w-16 bg-gray-800 flex flex-col items-center flex-shrink-0">
      <!-- Toggle Button -->
      <div class="py-4 w-full flex justify-center">
        <UTooltip
          :text="sidebarVisible ? 'Hide Menu' : 'Show Menu'"
          placement="right"
        >
          <UButton
            variant="ghost"
            :icon="
              sidebarVisible
                ? 'lucide:panel-left-close'
                : 'lucide:panel-left-open'
            "
            @click="toggleSidebar"
            class="transition duration-200 ease-in-out w-12 h-12 flex justify-center items-center rounded-lg hover:bg-gray-700 text-gray-300"
            :class="sidebarVisible ? 'bg-gray-700' : 'bg-gray-600'"
          />
        </UTooltip>
      </div>

      <!-- Navigation -->
      <div class="flex-1 w-full">
        <SidebarMiniMenu />
      </div>
    </aside>

    <!-- Sidebar -->
    <aside
      v-if="sidebarVisible"
      class="bg-gray-700 p-4 flex flex-col transition-all duration-300 border-l border-gray-600 flex-shrink-0"
      :class="
        isMobile || isTablet
          ? 'fixed inset-y-0 left-16 w-60 z-50 shadow-xl'
          : 'w-60'
      "
    >
      <CommonFull class="mb-9" />
      <SidebarMenu />
    </aside>

    <!-- Overlay for mobile -->
    <div
      v-if="sidebarVisible && (isMobile || isTablet)"
      class="fixed inset-0 left-16 bg-black bg-opacity-50 z-40"
      @click="setSidebarVisible(false)"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-0">
      <!-- Header -->
      <header
        class="h-16 border-b border-gray-600 flex items-center justify-between bg-background shrink-0"
        :class="isMobile ? 'px-3' : 'px-6'"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <CommonBreadCrumbs />
        </div>

        <!-- Action Buttons -->
        <div v-if="route.path.startsWith('/collections')" class="flex-shrink-0">
          <UButton
            :label="
              isMobile
                ? undefined
                : route.path === '/collections'
                ? 'Create New Table'
                : 'Save Changes'
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
            :size="isMobile ? 'sm' : 'md'"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/routings')"
          class="flex-shrink-0"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/routings/create') ||
              route.path.startsWith(
                `/settings/routings/${route.params.routeId}`
              )
            "
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/settings/routings/create`"
          />
        </div>
        <!-- All other action button sections made responsive -->
        <div
          v-else-if="route.path.startsWith('/settings/hooks')"
          class="flex-shrink-0"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/hooks/create') ||
              route.path.startsWith(`/settings/hooks/${route.params.id}`)
            "
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/settings/hooks/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/handlers')"
          class="flex-shrink-0"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/handlers/create') ||
              route.path.startsWith(`/settings/handlers/${route.params.id}`)
            "
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/settings/handlers/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/users')"
          class="flex-shrink-0"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/users/create') ||
              route.path.startsWith(`/settings/users/${route.params.id}`)
            "
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/settings/users/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/roles')"
          class="flex-shrink-0"
        >
          <UButton
            v-if="
              route.path.startsWith('/settings/roles/create') ||
              route.path.startsWith(`/settings/roles/${route.params.id}`)
            "
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
          <UButton
            v-else
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/settings/roles/create`"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/settings/general')"
          class="flex-shrink-0"
        >
          <UButton
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :label="isMobile ? undefined : 'Save'"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
          />
        </div>
        <div v-else-if="route.path.startsWith(`/data`)" class="flex-shrink-0">
          <UButton
            icon="lucide:plus"
            color="primary"
            variant="solid"
            :size="isMobile ? 'lg' : 'xl'"
            class="rounded-full"
            :to="`/data/${route.params.table}/create`"
            v-if="route.path === `/data/${route.params.table}`"
          />
          <UButton
            :label="isMobile ? undefined : 'Save'"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
            :size="isMobile ? 'sm' : 'md'"
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
        class="h-12 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
        :class="isMobile ? 'px-3' : 'px-6'"
      >
        <slot name="subheader">
          <!-- Fallback content if no slot -->
          <div class="flex items-center gap-3">
            <UButton
              icon="lucide:arrow-left"
              variant="soft"
              color="primary"
              @click="$router.back()"
              :label="isMobile ? undefined : 'Back'"
              :disabled="disableBack"
              :size="isMobile ? 'sm' : 'md'"
            />
          </div>
        </slot>
      </div>

      <!-- Page Content -->
      <section
        class="flex-1 min-h-0 overflow-auto"
        :class="isMobile ? 'p-3' : 'p-6'"
      >
        <slot />
      </section>
    </main>
  </div>

  <!-- Confirm Modal -->
  <div id="others-overlay"></div>

  <CommonGlobalConfirm />
  <CommonGlobalLoading
    :show="globalLoading"
    title="Processing Schema"
    description="This may take a moment due to server latency"
  />
  <CommonRouteLoading :show="routeLoading" message="Navigating..." />
  <CommonMobileWarning />
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
  setSidebarVisible,
} = useGlobalState();
const { isMobile, isTablet } = useScreen();
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

// Auto hide sidebar on mobile/tablet
watch(
  [isMobile, isTablet],
  ([mobile, tablet]) => {
    if (mobile || tablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  },
  { immediate: true }
);

await fetchSchema();
</script>
