<template>
  <div class="flex h-screen text-sm bg-background text-foreground">
    <!-- Skip Link for Keyboard Navigation -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded"
    >
      Skip to main content
    </a>

    <!-- Mini Sidebar -->
    <aside
      class="w-16 bg-gray-800 flex flex-col items-center flex-shrink-0"
      aria-label="Primary navigation"
    >
      <!-- Toggle Button -->
      <div class="py-4 w-full flex justify-center">
        <UTooltip
          :text="sidebarVisible ? 'Hide Menu' : 'Show Menu'"
          placement="right"
        >
          <UButton
            variant="ghost"
            :icon="
              sidebarVisible ? 'lucide:chevron-left' : 'lucide:chevron-right'
            "
            @click="toggleSidebar"
            class="w-12 h-12 flex justify-center items-center rounded-lg hover:bg-gray-700 text-gray-300"
            :class="sidebarVisible ? 'bg-gray-700' : 'bg-gray-600'"
            :aria-label="
              sidebarVisible ? 'Hide navigation menu' : 'Show navigation menu'
            "
            :aria-expanded="sidebarVisible"
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
        isTablet
          ? 'fixed inset-y-0 left-16 w-80 z-50 shadow-xl'
          : 'w-60'
      "
      aria-label="Secondary navigation"
    >
      <CommonFull class="mb-9" />
      <SidebarMenu />
    </aside>

    <!-- Overlay for tablet -->
    <div
      v-if="sidebarVisible && isTablet"
      class="fixed inset-0 left-16 bg-black bg-opacity-50 z-40"
      @click="setSidebarVisible(false)"
      role="presentation"
      aria-hidden="true"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-0" id="main-content">
      <!-- Header -->
      <LayoutHeader />

      <div
        class="h-12 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
        :class="isTablet ? 'px-4' : 'px-6'"
      >
        <slot name="subheader">
          <!-- Fallback content if no slot -->
          <div class="flex items-center gap-3">
            <UButton
              icon="lucide:arrow-left"
              variant="soft"
              color="primary"
              @click="goBack"
              label="Back"
              :disabled="disableBack"
              :size="isTablet ? 'sm' : 'md'"
            />
          </div>
        </slot>
      </div>

      <!-- Page Content -->
      <section
        class="flex-1 min-h-0 overflow-auto"
        :class="isTablet ? 'p-4' : 'p-6'"
      >
        <slot />
      </section>
    </main>
  </div>

  <!-- Confirm Modal -->
  <div id="others-overlay"></div>

  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="globalLoading"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
    >
      <div
        class="bg-background/95 backdrop-blur-md border border-muted/50 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
      >
        <CommonLoadingState
          type="spinner"
          context="page"
          title="Updating Schema"
          description="Please wait while we update the database schema. This may take a few moments..."
          size="lg"
        />
      </div>
    </div>
  </Transition>

  <CommonGlobalConfirm />
  <CommonMobileWarning />
  <RouteLoading :show="routeLoading" message="Navigating..." />
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const {
  globalLoading,
  sidebarVisible,
  routeLoading,
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

// Handle back navigation
function goBack() {
  router.back();
}

// Auto hide sidebar on tablet (no mobile support)
watch(
  isTablet,
  (tablet) => {
    if (tablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  },
  { immediate: true }
);
</script>
