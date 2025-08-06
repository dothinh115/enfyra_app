# FormField System Documentation

The FormField system in Enfyra CMS provides a comprehensive solution for rendering dynamic forms based on schema definitions. It includes form generation, validation, error handling, and field rendering.

## Core Components

### 1. FormEditor
The main form container that renders all form fields based on schema definition.

### 2. FormField
Individual field wrapper that handles layout, labels, and error display.

### 3. FormFieldRenderer (FieldRenderer)
Renders the actual input component based on field type.

### 4. FormValueRenderer (ValueRenderer)
Renders field values in read-only mode.

## Core Composables

### useSchema(tableName: string)

Main composable for working with form schemas and validation.

```typescript
const { generateEmptyForm, validate, getIncludeFields } = useSchema(tableName);
```

## Main Methods

### 1. `generateEmptyForm(options?)`

Creates an empty form object based on schema definition with proper default values.

```typescript
const { generateEmptyForm } = useSchema("user_definition");

const emptyForm = generateEmptyForm();
// Result: { name: "", email: "", role: null, isActive: false, ... }

// With exclusions
const formWithoutTimestamps = generateEmptyForm({ 
  excluded: ["createdAt", "updatedAt"] 
});
```

**Default Value Logic:**
- Uses `defaultValue` from schema if available
- Relations: `null` for one-to-one/many-to-one, `[]` for one-to-many/many-to-many
- Nullable fields: `null`
- Non-nullable fields: `""` for strings, `0` for numbers, `false` for booleans, `[]` for arrays

### 2. `validate(record)`

Validates form data against schema definition.

```typescript
const { validate } = useSchema("user_definition");

const { isValid, errors } = validate(formData);
// Result: { isValid: false, errors: { email: "This field is required" } }
```

**Validation Rules:**
- Required fields (non-nullable) cannot be empty
- Empty check: `null`, `undefined`, or empty string after trim
- Skips inverse relation fields
- Returns detailed error messages

### 3. `getIncludeFields()`

Generates include string for API calls to fetch related data.

```typescript
const { getIncludeFields } = useSchema("user_definition");

const includeStr = getIncludeFields();
// Result: "*, role.*, profile.*" (includes all relations)
```

## Usage Patterns

### 1. Create Form

```vue
<template>
  <UForm :state="form" @submit="handleCreate" ref="globalForm">
    <FormEditor
      v-model="form"
      v-model:errors="errors"
      :table-name="tableName"
    />
  </UForm>
</template>

<script setup>
const form = ref({});
const errors = ref({});
const { generateEmptyForm, validate } = useSchema("user_definition");

onMounted(() => {
  form.value = generateEmptyForm();
});

async function handleCreate() {
  const { isValid, errors: validationErrors } = validate(form.value);
  errors.value = validationErrors;

  if (!isValid) {
    toast.add({
      title: "Invalid data",
      description: "Please check the fields with errors.",
      color: "error",
    });
    return;
  }

  // Proceed with API call
  await createRecord({ body: form.value });
}
</script>
```

### 2. Edit Form

```vue
<template>
  <UForm :state="form" @submit="handleUpdate" ref="globalForm">
    <FormEditor
      v-model="form"
      v-model:errors="errors"
      :table-name="tableName"
      :excluded="['createdAt', 'updatedAt']"
    />
  </UForm>
</template>

<script setup>
const form = ref({});
const detail = ref(null);
const { validate } = useSchema("user_definition");

// Watch for API data and populate form
watch(apiData, (newData) => {
  if (newData?.data?.[0]) {
    detail.value = newData.data[0];
    form.value = { ...newData.data[0] };
  }
});

async function handleUpdate() {
  const { isValid, errors: validationErrors } = validate(form.value);
  
  if (!isValid) {
    errors.value = validationErrors;
    return;
  }

  await updateRecord({ body: form.value });
}
</script>
```

### 3. Read-only Form

```vue
<template>
  <FormEditor
    v-model="data"
    :table-name="tableName"
    :readonly="true"
  />
</template>
```

## FormEditor Props

```typescript
interface FormEditorProps {
  modelValue: Record<string, any>;     // Form data
  errors: Record<string, string>;      // Validation errors
  tableName: string;                   // Schema table name
  excluded?: string[];                 // Fields to exclude
  includes?: string[];                 // Fields to include (if specified, only these)
  typeMap?: Record<string, any>;       // Override field types/configs
  readonly?: boolean;                  // Read-only mode
}
```

### typeMap Configuration

Override field rendering behavior:

```typescript
const typeMap = {
  // Simple type override
  description: "richtext",
  
  // Advanced configuration
  status: {
    type: "select",
    disabled: false,
    placeholder: "Choose status",
    componentProps: {
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ]
    },
    fieldProps: {
      class: "col-span-2"
    }
  }
};
```

## Field Types Support

### Basic Types
- `string` → UInput
- `text` → UTextarea
- `number`/`int` → UInput with number validation
- `boolean` → USwitch
- `date`/`datetime` → Date picker
- `email` → Email input
- `password` → Password input

### Advanced Types
- `richtext` → TinyMCE editor
- `code` → Code editor with syntax highlighting
- `select` → Dropdown with options
- `multiselect` → Multiple selection
- `file` → File upload
- `image` → Image upload
- `json`/`simple-json` → JSON editor

### Relation Types
- `many-to-one` → Single select from related table
- `one-to-many` → Multi-select with create/edit capabilities
- `many-to-many` → Multi-select with relationship management
- `one-to-one` → Single select or inline form

## Error Handling

### Validation Errors

```typescript
// Set validation errors
errors.value = { 
  email: "This field is required",
  password: "Password must be at least 8 characters"
};

// Clear specific error
const newErrors = { ...errors.value };
delete newErrors.email;
errors.value = newErrors;

// Clear all errors
errors.value = {};
```

### API Error Integration

```typescript
// Handle API validation errors
try {
  await createRecord({ body: form.value });
} catch (error) {
  if (error.statusCode === 422) {
    // Set API validation errors
    errors.value = error.data?.errors || {};
  }
}
```

## Field Layout

### Grid System
FormEditor uses a responsive grid system:
- Default: 1 column on mobile, 2 columns on desktop
- Wide fields (richtext, code, text, simple-json): span 2 columns automatically
- Custom spanning via typeMap fieldProps

### Field Ordering
1. Fields sorted by schema definition ID
2. Relations are pushed to the end
3. Manual ordering via includes array

## Best Practices

### 1. Always Use Schema Validation

```typescript
// Good
const { isValid, errors } = validate(form.value);
if (!isValid) {
  errors.value = errors;
  return;
}

// Bad - skipping validation
await createRecord({ body: form.value });
```

### 2. Handle Loading States

```typescript
const { globalFormLoading } = useGlobalState();

async function handleSubmit() {
  globalFormLoading.value = true;
  try {
    await submitForm();
  } finally {
    globalFormLoading.value = false;
  }
}
```

### 3. Provide User Feedback

```typescript
// Success feedback
toast.add({
  title: "Success",
  color: "success",
  description: "Record created successfully"
});

// Error feedback
toast.add({
  title: "Validation Error",
  color: "error", 
  description: "Please check the highlighted fields"
});
```

### 4. Exclude System Fields

```typescript
// Always exclude system fields in create forms
const form = generateEmptyForm({ 
  excluded: ["id", "createdAt", "updatedAt"] 
});

// Or in FormEditor
<FormEditor
  :excluded="['id', 'createdAt', 'updatedAt']"
  ...
/>
```

### 5. Use TypeMap for Customization

```typescript
// Customize field behavior
const typeMap = {
  // Make description field full-width
  description: {
    type: "richtext",
    fieldProps: { class: "col-span-2" }
  },
  
  // Add placeholder
  email: {
    placeholder: "user@example.com"
  }
};
```

## Integration with Global State

### Global Form Reference

```typescript
const { globalForm, globalFormLoading } = useGlobalState();

// Form reference for programmatic submission
<UForm ref="globalForm" @submit="handleSubmit">
  <FormEditor ... />
</UForm>

// Submit from header button
globalForm.value?.submit();
```

### Global Loading State

```typescript
// Shows loading spinner on form submit button
globalFormLoading.value = true;
```

## Common Patterns

### 1. Master-Detail Forms

```typescript
// Load detail data
const { data: apiData } = useApiLazy(() => `/users/${id}`, {
  query: { fields: getIncludeFields() }
});

// Populate form when data loads
watch(apiData, (newData) => {
  if (newData?.data?.[0]) {
    form.value = { ...newData.data[0] };
  }
});
```

### 2. Conditional Field Display

```typescript
// Show/hide fields based on other field values
const visibleFields = computed(() => {
  const fields = ["name", "email"];
  if (form.value.type === "admin") {
    fields.push("permissions");
  }
  return fields;
});

<FormEditor :includes="visibleFields" ... />
```

### 3. Custom Validation

```typescript
function customValidate(data: Record<string, any>) {
  const { isValid, errors } = validate(data);
  
  // Add custom validation
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
    return { isValid: false, errors };
  }
  
  return { isValid, errors };
}
```

This comprehensive form system provides a robust foundation for creating dynamic, validated forms in Enfyra CMS with minimal boilerplate code.