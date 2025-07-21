<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  relationMeta: any;
  selected: any[];
}>();
const emit = defineEmits(["update:modelValue", "created", "update:selected"]);

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const { tables } = useGlobalState();
const targetTable = tables.value.find(
  (t) => t.id === props.relationMeta.targetTable.id
);
const { generateEmptyForm, validate } = useSchema(targetTable?.name);

const createForm = ref(generateEmptyForm());
const createErrors = ref({});
const creating = ref(false);

watch(show, (val) => {
  if (val) {
    createForm.value = generateEmptyForm({
      excluded: [props.relationMeta.inversePropertyName],
    });
  }
});

async function createNewRecord() {
  if (!targetTable?.name) return;
  const { isValid, errors } = validate(createForm.value);
  if (!isValid) {
    createErrors.value = errors;
    return;
  }

  creating.value = true;
  try {
    const { data } = await useApiLazy(`/${targetTable.name}`, {
      method: "post",
      body: createForm.value,
    });
    emit("update:selected", [...props.selected, { id: data.value.data[0].id }]);
    emit("created");
    show.value = false;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <UDrawer v-model:open="show" direction="right" class="min-w-xl">
      <template #header>
        <h2>Tạo mới {{ targetTable?.name }}</h2>
        <UButton
          icon="lucide:x"
          @click="show = false"
          variant="ghost"
          color="error"
        />
      </template>
      <template #body>
        <DynamicFormEditor
          v-model="createForm"
          :table-name="targetTable?.name"
          :errors="createErrors"
        />
        <div class="flex justify-end border-t pt-2 mt-4">
          <UButton
            icon="lucide:plus"
            @click="createNewRecord"
            :loading="creating"
            >Tạo mới</UButton
          >
        </div>
      </template>
    </UDrawer>
  </Teleport>
</template>
