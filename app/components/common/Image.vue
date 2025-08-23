<template>
  <div
    ref="containerRef"
    :class="[
      'relative overflow-hidden',
      shapeClasses,
      sizeClasses,
      containerClass,
    ]"
    :style="[aspectRatioStyle, containerStyle]"
  >
    <div
      v-if="isLoading"
      :class="[loadingContainerClasses, shapeClasses]"
      :style="loadingAreaSize"
    >
      <div
        class="absolute inset-0 bg-gray-200 dark:bg-gray-700"
        :class="shapeClasses"
        :style="loadingAreaSize"
      />

      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
        :class="[shapeClasses, 'animate-shimmer']"
        :style="loadingAreaSize"
        style="background-size: 200% 100%"
      />

      <div
        class="absolute inset-0 flex items-center justify-center"
        :style="loadingAreaSize"
      >
        <UIcon
          name="lucide:image"
          class="text-gray-300 dark:text-gray-600 opacity-50"
          :size="loadingIconSize"
        />
      </div>
    </div>

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

    <img
      v-if="shouldLoad"
      ref="imageRef"
      :src="imageSrc"
      :alt="alt"
      :class="[
        isLoading ? 'image-loading' : 'image-loaded',
        'object-cover',
        imageClass,
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
  loadingArea?: "full" | "center" | "custom";
  customLoadingSize?: string;
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
  loadingArea: "full",
  customLoadingSize: "100px",
});

const containerRef = ref<HTMLDivElement>();
const imageRef = ref<HTMLImageElement>();
const isLoading = ref(true);
const hasError = ref(false);
const isRetrying = ref(false);
const retryCount = ref(0);
const isInViewport = ref(false);
const maxRetries = 3;
const retryTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const imageSrc = computed(() => {
  let src = props.src;

  if (src.startsWith("/assets/")) {
    src = src.replace("/assets/", "/api/assets/");
  } else if (src.startsWith("assets/")) {
    src = src.replace("assets/", "/api/assets/");
  }

  if (src.startsWith("/api/assets/") && !src.includes("format=")) {
    const url = new URL(src, window.location.origin);
    url.searchParams.set("format", "avif");
    src = url.pathname + url.search;
  }

  return src;
});

const isCustomLoading = computed(() => 
  props.loadingArea === "custom" && isLoading.value
);

const sizeClasses = computed(() => {
  if (isCustomLoading.value) {
    return "";
  }

  const sizes = {
    xs: "w-8 h-8",
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
    custom: "w-full h-full",
  };
  return sizes[props.size];
});

const shapeClasses = computed(() => {
  const shapes = {
    square: "",
    rounded: "rounded-lg",
    circle: "rounded-full",
    none: "",
  };
  return shapes[props.shape];
});

const aspectRatioStyle = computed(() => {
  if (props.aspectRatio && props.size === "custom") {
    return { aspectRatio: props.aspectRatio };
  }

  if (props.size === "custom") {
    return {
      minWidth: "100px",
      minHeight: "100px",
    };
  }

  return {};
});

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

const imageClass = computed(() => props.class);

const loadingContainerClasses = computed(() => "absolute inset-0");

const loadingAreaSize = computed(() => {
  if (props.loadingArea === "custom") {
    const size = props.customLoadingSize;
    return {
      width: `${size} !important`,
      height: `${size} !important`,
      minWidth: `${size} !important`,
      minHeight: `${size} !important`,
    };
  }
  return {};
});

const containerStyle = computed(() => {
  if (isCustomLoading.value) {
    const size = props.customLoadingSize;
    return {
      width: size,
      height: size,
      minWidth: size,
      minHeight: size,
    };
  }
  return {};
});

const shouldLoad = computed(() => {
  return isInViewport.value;
});

function handleLoad() {
  isLoading.value = false;
  hasError.value = false;
  isRetrying.value = false;
}

function handleError() {
  isLoading.value = false;
  isRetrying.value = false;

  if (props.fallbackSrc && retryCount.value === 0) {
    retryCount.value++;
    const img = imageRef.value;
    if (img instanceof HTMLImageElement && props.fallbackSrc) {
      img.src = props.fallbackSrc;
    }
  } else if (retryCount.value < maxRetries) {
    retryCount.value++;
    retryTimer.value = setTimeout(() => {
      retryLoad();
    }, 1000 * retryCount.value);
  } else {
    hasError.value = true;
    if (import.meta.dev) {
      console.warn(
        `Failed to load image after ${maxRetries} retries:`,
        props.src
      );
    }
  }
}

function retryLoad() {
  if (retryCount.value < maxRetries) {
    isRetrying.value = true;
    hasError.value = false;
    isLoading.value = true;
    retryCount.value++;

    const img = imageRef.value;
    if (img instanceof HTMLImageElement) {
      img.src = "";
      requestAnimationFrame(() => {
        if (imageRef.value instanceof HTMLImageElement) {
          imageRef.value.src = imageSrc.value;
        }
      });
    }
  } else {
    if (import.meta.dev) {
      console.warn(`Max retries (${maxRetries}) reached for image:`, props.src);
    }
  }
}

const observer = ref<IntersectionObserver>();

onMounted(() => {
  isLoading.value = true;

  if ("IntersectionObserver" in window) {
    nextTick(() => {
      if (!containerRef.value) return;

      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isInViewport.value) {
              isInViewport.value = true;
              observer.value?.disconnect();
            }
          });
        },
        {
          rootMargin: "50px",
          threshold: 0.01,
        }
      );

      observer.value.observe(containerRef.value);
    });
  } else {
    isInViewport.value = true;
  }
});

onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect();
    observer.value = undefined;
  }
  
  if (retryTimer.value) {
    clearTimeout(retryTimer.value);
    retryTimer.value = null;
  }
});

onUnmounted(() => {
  observer.value?.disconnect();
});

watch(
  () => props.src,
  () => {
    isLoading.value = false;
    hasError.value = false;
    isRetrying.value = false;
    retryCount.value = 0;
    isInViewport.value = false;
  }
);
</script>
