<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40"
      >
        <div class="flex flex-col items-center gap-4">
          <!-- Modern spinner -->
          <div class="relative">
            <!-- Outer ring with glow -->
            <div
              class="w-20 h-20 border-4 border-primary/10 rounded-full shadow-lg"
            ></div>
            <!-- Spinning ring -->
            <div
              class="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-primary rounded-full animate-spin"
              style="animation-duration: 1s"
            ></div>
            <!-- Inner pulse -->
            <div
              class="absolute inset-5 bg-primary/20 rounded-full animate-pulse"
            ></div>
          </div>

          <!-- Optional message -->
          <p v-if="message" class="text-sm text-muted-foreground">
            {{ message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: "Loading...",
});
</script>
