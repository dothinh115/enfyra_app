<script setup lang="ts">
const props = defineProps<{
  keyName: string;
  formData: Record<string, any>;
  columnMap: Map<string, any>;
}>();

function renderValue(key: string): string {
  const val = props.formData[key];
  const column = props.columnMap.get(key);
  const isRelation = column?.fieldType === "relation";

  if (val === null || val === undefined) return "—";

  // If it's a relation (1-1 or 1-n)
  if (isRelation) {
    if (Array.isArray(val)) {
      const ids = val.map((item) =>
        item && typeof item === "object" && "id" in item ? item.id : "?"
      );
      return ids.length ? ids.join(", ") : "—";
    }

    if (typeof val === "object") {
      return "id" in val ? String(val.id) : JSON.stringify(val, null, 2);
    }
  }

  // Boolean
  if (typeof val === "boolean") return val ? "true" : "false";

  // Array (not relation)
  if (Array.isArray(val)) return val.length ? val.join(", ") : "—";

  // Object (non-relation)
  if (typeof val === "object") {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return "[object]";
    }
  }

  // Default: primitive
  return String(val);
}

const displayValue = computed(() => renderValue(props.keyName));
</script>

<template>
  <div class="text-sm whitespace-pre-wrap font-mono">
    {{ displayValue }}
  </div>
</template>
