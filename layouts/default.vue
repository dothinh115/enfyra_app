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

        <!-- Action Buttons -->
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
            label="Save"
            icon="lucide:newspaper"
            color="primary"
            variant="solid"
            :loading="globalFormLoading"
            @click="globalForm?.submit()"
          />
        </div>
        <div
          v-else-if="route.path.startsWith('/data')"
          class="flex gap-2 items-center"
        >
          <UButton
            icon="lucide:plus"
            color="primary"
            variant="solid"
            size="xl"
            class="rounded-full"
            :to="`/data/${route.params.table}/create`"
          />
        </div>
      </header>

      <div
        class="h-12 px-6 border-b border-gray-700 flex items-center justify-between bg-background shrink-0"
      >
        <slot name="subheader">
          <!-- Fallback nội dung nếu không có slot -->
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
  <GlobalConfirm />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import { useGlobalState } from "~/composables/useGlobalState";

const route = useRoute();
const router = useRouter();
const { fetchSchema, globalForm, globalFormLoading } = useGlobalState();

// ✅ Tính toán segment breadcrumb từ route
const segments = computed(() => {
  const parts = route.path.split("/").filter(Boolean);

  return parts.map((part, i) => {
    const label = decodeURIComponent(part);
    const icon = "lucide:chevron-right";
    const to = "/" + parts.slice(0, i + 1).join("/");
    return { label, icon, to };
  });
});

// ✅ Disable nút quay lại nếu chỉ còn 1 segment (gốc)
const disableBack = computed(() => segments.value.length <= 1);

await fetchSchema();
</script>
