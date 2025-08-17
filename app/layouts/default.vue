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
    <Transition :name="isTablet ? 'fade-tablet' : ''" mode="out-in">
      <aside
        v-if="sidebarVisible"
        class="bg-gray-700 p-4 flex flex-col border-l border-gray-600 flex-shrink-0"
        :class="
          isTablet
            ? 'fixed inset-y-0 left-16 w-80 z-50 shadow-xl'
            : 'w-60 transition-all duration-300'
        "
        aria-label="Secondary navigation"
      >
        <CommonFull class="mb-9" />
        <SidebarMenu />
      </aside>
    </Transition>

    <!-- Overlay for tablet -->
    <Transition name="fade">
      <div
        v-if="sidebarVisible && isTablet"
        class="fixed inset-0 left-16 bg-black/20 backdrop-blur-sm z-40"
        @click="setSidebarVisible(false)"
        role="presentation"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-h-0" id="main-content">
      <!-- Header -->
      <LayoutHeader />

      <!-- Sub Header -->
      <LayoutSubHeader />

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

// Layout logic moved to LayoutSubHeader component

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
