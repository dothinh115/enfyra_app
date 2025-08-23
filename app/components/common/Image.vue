<template>
  <div
    :class="[
      'relative overflow-hidden',
      shapeClasses,
      sizeClasses,
      containerClass,
    ]"
    :style="aspectRatioStyle"
  >
    <!-- Loading Skeleton -->
    <div v-show="isLoading" :class="['absolute inset-0', shapeClasses]">
      <!-- Shimmer effect background -->
      <div
        class="absolute inset-0 bg-gray-200 dark:bg-gray-700"
        :class="shapeClasses"
      />

      <!-- Animated shimmer overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        :class="[shapeClasses, 'animate-shimmer']"
        style="background-size: 200% 100%"
      />

      <!-- Center icon for better UX -->
      <div class="absolute inset-0 flex items-center justify-center">
        <UIcon
          name="lucide:image"
          class="text-gray-300 dark:text-gray-600 opacity-50"
          :size="loadingIconSize"
        />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-show="hasError && !isRetrying"
      :class="[
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
        shapeClasses,
      ]"
    >
      <UIcon
        name="lucide:image-off"
        :size="errorIconSize"
        class="mb-2 opacity-50"
      />
      <span v-if="showErrorText" class="text-xs text-center px-2">
        {{ errorText }}
      </span>
      <UButton
        v-if="allowRetry"
        size="xs"
        variant="ghost"
        @click="retryLoad"
        class="mt-2"
      >
        Retry
      </UButton>
    </div>

    <!-- Main Image -->
    <img
      v-if="shouldLoad"
      ref="imageRef"
      :src="imageSrc"
      :alt="alt"
      :class="[
        'w-full h-full object-cover transition-all duration-500 ease-out',
        imageClass,
        {
          'opacity-0 scale-105': isLoading,
          'opacity-100 scale-100': !isLoading && !hasError,
        },
      ]"
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Placeholder when not loading -->
    <img
      v-else
      ref="imageRef"
      src=""
      :alt="alt"
      :class="[
        'w-full h-full object-cover transition-all duration-500 ease-out',
        imageClass,
        'opacity-0',
      ]"
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick } from "vue";

type ImageSize = "xs" | "sm" | "md" | "lg" | "xl" | "custom";
type ImageShape = "square" | "rounded" | "circle" | "none";

interface Props {
  src: string;
  alt?: string;
  class?: string;
  containerClass?: string;
  size?: ImageSize;
  shape?: ImageShape;
  aspectRatio?: string;
  fallbackSrc?: string;
  allowRetry?: boolean;
  showErrorText?: boolean;
  errorText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  class: "",
  containerClass: "",
  size: "custom",
  shape: "none",
  aspectRatio: "",
  fallbackSrc: "",
  allowRetry: true,
  showErrorText: false,
  errorText: "Failed to load image",
});

// Refs
const imageRef = ref<HTMLImageElement>();
const isLoading = ref(true);
const hasError = ref(false);
const isRetrying = ref(false);
const retryCount = ref(0);
const isInViewport = ref(false);
const maxRetries = 3;

// Convert assets path to /api/assets/... for backend proxy
const imageSrc = (() => {
  let src = props.src;

  if (src.startsWith("/assets/")) {
    src = src.replace("/assets/", "/api/assets/");
  } else if (src.startsWith("assets/")) {
    src = src.replace("assets/", "/api/assets/");
  }

  // Auto-add format=avif if no format specified for backend assets
  if (src.startsWith("/api/assets/") && !src.includes("format=")) {
    const url = new URL(src, window.location.origin);
    url.searchParams.set("format", "avif");
    src = url.pathname + url.search;
  }

  return src;
})();

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: "w-8 h-8",
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
    custom: "min-w-[100px] min-h-[100px]",
  };
  return sizes[props.size];
});

// Shape classes
const shapeClasses = computed(() => {
  const shapes = {
    square: "",
    rounded: "rounded-lg",
    circle: "rounded-full",
    none: "",
  };
  return shapes[props.shape];
});

// Aspect ratio style
const aspectRatioStyle = computed(() => {
  if (props.aspectRatio && props.size === "custom") {
    return { aspectRatio: props.aspectRatio };
  }
  return {};
});

// Dynamic icon sizes
const errorIconSize = computed(() => {
  const iconSizes = {
    xs: "12",
    sm: "16",
    md: "20",
    lg: "24",
    xl: "32",
    custom: "24",
  };
  return iconSizes[props.size];
});

const loadingIconSize = computed(() => {
  const iconSizes = {
    xs: "16",
    sm: "20",
    md: "24",
    lg: "32",
    xl: "40",
    custom: "32",
  };
  return iconSizes[props.size];
});

// Image class
const imageClass = computed(() => props.class);

// Determine if we should load the image
const shouldLoad = computed(() => {
  // Always lazy loading - only load if in viewport
  return isInViewport.value;
});

// Handle image load success
function handleLoad() {
  isLoading.value = false;
  hasError.value = false;
  isRetrying.value = false;
}

// Handle image load error
function handleError() {
  isLoading.value = false;
  isRetrying.value = false;

  if (props.fallbackSrc && retryCount.value === 0) {
    // Try fallback image first
    retryCount.value++;
    if (imageRef.value && props.fallbackSrc) {
      imageRef.value.src = props.fallbackSrc;
    }
  } else if (retryCount.value < maxRetries) {
    // Auto retry with original src
    retryCount.value++;
    setTimeout(() => {
      retryLoad();
    }, 1000 * retryCount.value); // Exponential backoff
  } else {
    hasError.value = true;
    console.warn(
      `Failed to load image after ${maxRetries} retries:`,
      props.src
    );
  }
}

// Manual retry function
function retryLoad() {
  if (retryCount.value < maxRetries) {
    isRetrying.value = true;
    hasError.value = false;
    isLoading.value = true;
    retryCount.value++;

    if (imageRef.value) {
      // Clear src and reload to trigger load event
      imageRef.value.src = "";
      requestAnimationFrame(() => {
        if (imageRef.value) {
          imageRef.value.src = imageSrc;
        }
      });
    }
  } else {
    console.warn(`Max retries (${maxRetries}) reached for image:`, props.src);
  }
}

// Set up intersection observer for lazy loading
const observer = ref<IntersectionObserver>();

onMounted(() => {
  // Always start with lazy loading state
  isLoading.value = false;

  // Use IntersectionObserver to detect viewport
  if ("IntersectionObserver" in window) {
    // Small delay to ensure DOM is ready
    nextTick(() => {
      if (!imageRef.value) return;

      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isInViewport.value) {
              // Reset loading state and trigger image load
              isLoading.value = true;
              isInViewport.value = true;
              observer.value?.disconnect();
            }
          });
        },
        {
          // Start loading when image is 50px before entering viewport
          rootMargin: "50px",
          threshold: 0.01,
        }
      );

      observer.value.observe(imageRef.value);
    });
  } else {
    // Fallback: if no IntersectionObserver support, load immediately
    isInViewport.value = true;
    isLoading.value = true;
  }
});

// Cleanup observer on unmount
onUnmounted(() => {
  observer.value?.disconnect();
});

// Watch src changes
watch(
  () => props.src,
  () => {
    // Reset states when src changes
    isLoading.value = false;
    hasError.value = false;
    isRetrying.value = false;
    retryCount.value = 0;
    isInViewport.value = false;
  }
);
</script>
