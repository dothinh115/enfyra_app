# API Layer with Error Handling

Enhanced API composables that provide automatic error handling with toast notifications while maintaining the same interface as the original `useApi` and `useApiLazy`.

## Features

- **Drop-in replacement** - Same interface as `useApi` and `useApiLazy`
- **Automatic error handling** - Shows toast notifications for errors
- **Backend error format support** - Extracts error messages from backend responses
- **Context-aware errors** - Provides context for better debugging
- **No breaking changes** - Existing code continues to work
- **Codebase migration** - All API calls have been migrated to use error handling

## Usage

### Basic Usage

```typescript
// Instead of useApi (reactive)
const { data, error, pending } = useApi("/users");

// Use useApiWithError for automatic error handling (reactive)
const { data, error, pending } = useApiWithError("/users", {
  errorContext: "User List",
});

// Instead of useApiLazy (async)
const { data, error } = await useApiLazy("/users", {
  method: "post",
  body: userData,
});

// Use useApiLazyWithError for automatic error handling (async)
const { data, error } = await useApiLazyWithError("/users", {
  method: "post",
  body: userData,
  errorContext: "Create User",
});
```

### Error Context

The `errorContext` parameter helps identify where errors occur:

```typescript
const { data } = useApiWithError("/users", {
  errorContext: "Load Users", // Will show "API Error in Load Users"
});

const { data } = await useApiLazyWithError("/users", {
  method: "post",
  body: userData,
  errorContext: "Create User", // Will show "API Error in Create User"
});
```

## Supported Error Formats

### Backend Error Response

```json
{
  "response": {
    "data": {
      "message": "Validation failed",
      "error": "Email is required"
    }
  }
}
```

### Simple Error Format

```json
{
  "data": {
    "message": "User not found"
  }
}
```

### Direct Message

```json
{
  "message": "Network error"
}
```

## Migration

### From useApi to useApiWithError

```typescript
// Before
const { data, error, pending } = useApi("/users", { method: "get" });

// After
const { data, error, pending } = useApiWithError("/users", {
  method: "get",
  errorContext: "Load Users",
});
```

### From useApiLazy to useApiLazyWithError

```typescript
// Before
const { data, error } = await useApiLazy("/users", {
  method: "post",
  body: userData,
});

// After
const { data, error } = await useApiLazyWithError("/users", {
  method: "post",
  body: userData,
  errorContext: "Create User",
});
```

## Benefits

1. **No learning curve** - Same interface as existing composables
2. **Automatic error notifications** - No manual error handling required
3. **Better user experience** - Users see meaningful error messages
4. **Improved debugging** - Context helps identify error sources
5. **Backward compatible** - Existing code continues to work
6. **Consistent error handling** - All API calls now have automatic error handling

## Error Handling

The composables automatically:

- Extract error messages from backend responses
- Show toast notifications for errors using Nuxt UI's `useToast`
- Log errors to console with context
- Handle different error formats gracefully
- Remove the need for manual error checking in components

## Codebase Status

✅ **Completed Migration:**

- All `useApi` calls → `useApiWithError`
- All `useApiLazy` calls → `useApiLazyWithError`
- Removed manual error handling in components
- Consistent error context across the application

## Example Component

```vue
<script setup>
const {
  data: users,
  error,
  pending,
} = useApiWithError("/users", {
  errorContext: "Load Users",
});

const createUser = async (userData) => {
  const { data, error } = await useApiLazyWithError("/users", {
    method: "post",
    body: userData,
    errorContext: "Create User",
  });

  if (!error.value) {
    console.log("User created:", data.value);
  }
};
</script>
```
