<template>
  <Suspense>
    <CodeEditor v-bind="$attrs" />
    <template #fallback>
      <UTextarea 
        v-bind="$attrs" 
        placeholder="Loading code editor..." 
        disabled 
        class="w-full font-mono text-xs"
      />
    </template>
  </Suspense>
</template>

<script setup lang="ts">
const CodeEditor = defineAsyncComponent(() => 
  import('./CodeEditor.vue')
);
</script>