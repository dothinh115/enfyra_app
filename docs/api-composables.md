# useApi and useApiLazy Composables Guide

This guide explains how to use the `useApi` and `useApiLazy` composables for making API requests in the Enfyra CMS application.

## Overview

Both composables provide a consistent interface for API requests with automatic error handling, loading states, and TypeScript support.

### Key Differences

- **`useApi`**: Uses Nuxt's `useFetch` internally, supports SSR, executes immediately by default
- **`useApiLazy`**: Uses `$fetch`, client-side only, manual execution only (never auto-executes)

## Basic Usage

### useApi

```typescript
// Automatic execution on component mount
const { data, pending, error, execute } = useApi(() => "/users", {
  query: { limit: 10 },
  errorContext: "Fetch Users",
});

// Manual execution with immediate: false
const { data, pending, error, execute } = useApi(() => "/users", {
  immediate: false,
  errorContext: "Fetch Users",
});

// Execute manually later
await execute();
```

### useApiLazy

```typescript
// Always requires manual execution
const { data, pending, error, execute } = useApiLazy(() => "/users", {
  query: { limit: 10 },
  errorContext: "Fetch Users",
});

// Execute when needed
await execute();

// Execute with dynamic body
await execute({ body: { name: "John" } });

// Execute with dynamic ID (for patch/delete)
await execute({ id: "123" });

// Execute with dynamic ID and body
await execute({ id: "123", body: { name: "Updated Name" } });

// Batch operations (useApiLazy only, patch/delete methods only)
await execute({ ids: ["1", "2", "3"] }); // Multiple IDs
await execute({ ids: ["1", "2"], body: { status: "inactive" } }); // Batch update
```

## API Options

Both composables accept similar options:

```typescript
interface UseApiOptions<T> {
  method?: "get" | "post" | "patch" | "put" | "delete";
  body?: any | ComputedRef<any>;
  query?: any | ComputedRef<any>;
  errorContext?: string;
  immediate?: boolean; // Only for useApi, defaults to true
  disableBatch?: boolean; // Only for useApiLazy
  watch?: boolean; // Only for useApi
  default?: () => T | Ref<T>; // Only for useApi
}
```

## Error Handling

Both composables provide automatic error handling:

1. **Automatic Toast Notifications**: Errors are automatically displayed as toast notifications
2. **Error Context**: Provide `errorContext` to help users understand where the error occurred
3. **Error State**: Access error details via the `error` ref

```typescript
const { data, error, execute } = useApiLazy(() => "/users", {
  errorContext: "Create User", // Shows "Create User: [error message]" in toast
});

// Check error state
if (error.value) {
  console.log("Error occurred:", error.value);
}
```

## Common Patterns

### Dynamic Paths

Always use functions for paths to support reactivity:

```typescript
const userId = ref(1);

// ✅ Correct - reactive path
const { data } = useApi(() => `/users/${userId.value}`);

// ❌ Wrong - static string
const { data } = useApi(`/users/${userId.value}`);
```

### Computed Query/Body

Use computed refs for reactive query parameters:

```typescript
const page = ref(1);
const limit = ref(10);

const { data, execute } = useApiLazy(() => "/users", {
  query: computed(() => ({
    page: page.value,
    limit: limit.value,
    sort: "-createdAt",
  })),
});

// When page changes, just re-execute  
watch(page, async () => await execute());
```

### CRUD Operations

```typescript
// List/Read
const {
  data: users,
  pending,
  execute: fetchUsers,
} = useApiLazy(() => "/users", { errorContext: "Fetch Users" });

// Create
const { execute: createUser } = useApiLazy(() => "/users", {
  method: "post",
  errorContext: "Create User",
});

// Update - use dynamic ID
const { execute: updateUser } = useApiLazy(() => "/users", {
  method: "patch",
  errorContext: "Update User",
});

// Delete - use dynamic ID
const { execute: deleteUser } = useApiLazy(() => "/users", {
  method: "delete",
  errorContext: "Delete User",
});

// Usage with dynamic IDs
await createUser({ body: { name: "John", email: "john@example.com" } });
await updateUser({ id: userId, body: { name: "John Doe" } });
await deleteUser({ id: userId });

// Batch operations (delete/patch only)
await deleteUser({ ids: ["1", "2", "3"] }); // Delete multiple users
await updateUser({ ids: ["1", "2"], body: { isActive: false } }); // Update multiple
```

### Pagination

```typescript
const page = ref(1);
const limit = 10;

const {
  data: apiData,
  pending,
  execute,
} = useApiLazy(() => "/users", {
  query: computed(() => ({
    page: page.value,
    limit,
    meta: "totalCount",
  })),
  errorContext: "Fetch Users",
});

// Computed values from API response
const users = computed(() => apiData.value?.data || []);
const total = computed(() => apiData.value?.meta?.totalCount || 0);

// Watch page changes
watch(page, async () => await execute());

// Initial fetch
onMounted(async () => await execute());
```

## Batch Operations

### Batch Delete/Patch with Multiple IDs

`useApiLazy` hỗ trợ batch operations cho `patch` và `delete` methods:

```typescript
// Batch delete multiple users
const { execute: deleteUsers } = useApiLazy(() => "/user_definition", {
  method: "delete",
  errorContext: "Delete Users",
});

// Delete multiple users at once
await deleteUsers({ ids: ["1", "2", "3"] });

// Batch update multiple roles
const { execute: updateRoles } = useApiLazy(() => "/role_definition", {
  method: "patch",
  errorContext: "Update Roles",
});

// Update multiple roles with same data
await updateRoles({
  ids: ["role1", "role2"],
  body: { isActive: true },
});
```

**Lưu ý:**

- Chỉ hỗ trợ `patch` và `delete` methods
- Sử dụng `Promise.all` để chạy song song
- Trả về array responses
- Không hỗ trợ `get` và `post` methods với batch IDs

## Best Practices

### 1. Always Use at Setup Level

```typescript
// ✅ Correct - at setup level with dynamic ID support
const { execute: deleteItem } = useApiLazy(() => `/items`, {
  method: "delete",
  errorContext: "Delete Item",
});

async function handleDelete(id: string) {
  await deleteItem({ id });
}

// ❌ Wrong - inside function (violates Composition API rules)
async function handleDelete(id: string) {
  const { execute } = useApiLazy(() => `/items/${id}`, {
    method: "delete",
  });
  await execute();
}
```

**Why this matters:**
- **Composition API Rules**: Composables must be called at setup level
- **Performance**: Avoids creating new reactive instances on every call
- **Reactivity**: Proper reactive state management
- **Memory**: Prevents memory leaks from uncleaned reactive instances

### 2. Never Use Try-Catch with useApiLazy

**❌ WRONG - Don't do this:**

```typescript
async function deleteUser() {
  try {
    await executeDeleteUser();
    toast.add({ title: "Success", color: "success" });
  } catch (error) {
    // ❌ This is wrong! Error handling is already automatic
    console.log("Error:", error);
  }
}
```

**✅ CORRECT - Do this instead:**

```typescript
async function deleteUser() {
  await executeDeleteUser();

  // Check error state if needed
  if (deleteError.value) {
    return; // Error already handled by useApiLazy
  }

  toast.add({ title: "Success", color: "success" });
}
```

**✅ EVEN BETTER - With dynamic ID:**

```typescript
const { execute: deleteUserApi, error: deleteError } = useApiLazy(() => "/users", {
  method: "delete",
  errorContext: "Delete User",
});

async function deleteUser(userId: string) {
  await deleteUserApi({ id: userId });

  if (deleteError.value) {
    return; // Error toast already shown
  }

  toast.add({ title: "Success", color: "success" });
}
```

**Why no try-catch?**

- **Automatic Error Handling**: `useApiLazy` automatically handles errors and shows toast notifications
- **Error State Management**: Use `error.value` to check if an error occurred
- **Cleaner Code**: No need for try-catch blocks that don't add value
- **Consistent UX**: All errors are handled the same way across the application

**Example with proper error checking:**

```typescript
async function updateUser() {
  await executeUpdateUser();

  if (updateError.value) {
    // Error already handled by useApiLazy
    return;
  }

  // Success case
  toast.add({ title: "User updated", color: "success" });
  router.push("/users");
}
```

### 3. Provide Error Context

Always include `errorContext` for better error messages:

```typescript
const { execute } = useApiLazy(() => "/users", {
  method: "post",
  errorContext: "Create User", // User sees: "Create User: Network error"
});
```

### 4. Handle Loading States

```vue
<template>
  <CommonLoadingState v-if="pending" />
  <div v-else>
    <!-- Content -->
  </div>
</template>

<script setup>
const { data, pending, execute } = useApiLazy(() => "/users", {
  errorContext: "Fetch Users",
});

onMounted(async () => await execute());
</script>
```

### 5. Type Safety

Define types for your API responses:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const { data, execute } = useApiLazy<{ data: User[] }>(() => "/users", {
  errorContext: "Fetch Users",
});

// Now data.value is typed as { data: User[] } | null
const users = computed(() => data.value?.data || []);
```

### 6. Use Batch Operations Wisely

```typescript
// ✅ Good - batch delete multiple items
const { execute: deleteItems } = useApiLazy(() => "/items", {
  method: "delete",
  errorContext: "Delete Items",
});

async function bulkDelete(selectedIds: string[]) {
  await deleteItems({ ids: selectedIds });
  
  if (deleteError.value) {
    return;
  }
  
  toast.add({ title: `${selectedIds.length} items deleted`, color: "success" });
}

// ✅ Good - batch update with same data
const { execute: updateItems } = useApiLazy(() => "/items", {
  method: "patch", 
  errorContext: "Update Items",
});

async function bulkActivate(selectedIds: string[]) {
  await updateItems({ 
    ids: selectedIds, 
    body: { isActive: true } 
  });
}
```

**Batch Limitations:**
- Only works with `patch` and `delete` methods
- All items get the same body data (for patch)
- Not suitable for different data per item

## Migration Guide

If you're migrating from direct `$fetch` usage:

```typescript
// Before
async function fetchUsers() {
  try {
    loading.value = true;
    const response = await $fetch("/api/users");
    users.value = response.data;
  } catch (error) {
    toast.add({ title: "Error", description: error.message });
  } finally {
    loading.value = false;
  }
}

// After
const { data, pending, execute } = useApiLazy(() => "/users", {
  errorContext: "Fetch Users",
});

const users = computed(() => data.value?.data || []);
// Error handling and loading states are automatic!
```

**Key Changes:**

1. **Remove try-catch blocks** - Error handling is automatic
2. **Remove manual loading state** - Use `pending` from composable
3. **Remove manual error handling** - Check `error.value` if needed
4. **Use reactive data** - `data.value` automatically updates

## Troubleshooting

### Common Issues

1. **"path is not a function" error**
   - Always pass a function: `() => "/endpoint"`, not `"/endpoint"`

2. **Changes not reactive**
   - Use computed refs for dynamic query/body
   - Ensure path function accesses reactive values

3. **Multiple executions**
   - Check `immediate` option (defaults to `true` for useApi)
   - Avoid calling execute in watchers if using immediate

4. **TypeScript errors**
   - Use `pending` not `loading` in destructuring
   - Ensure composables are at setup level

5. **Composable called inside function**
   - Move all composables to setup level
   - Use dynamic IDs with `{ id }` parameter instead

6. **Error handling not working**
   - Don't use try-catch blocks
   - Check `error.value` instead of catching exceptions

### Common Anti-Patterns

```typescript
// ❌ Don't do these:
async function badFunction(id: string) {
  // Anti-pattern 1: Composable inside function
  const { execute } = useApiLazy(() => `/items/${id}`, {...});
  
  try {
    // Anti-pattern 2: Unnecessary try-catch
    await execute();
  } catch (err) {
    // Anti-pattern 3: Manual error handling
    toast.add({ title: "Error", description: err.message });
  }
}

// ✅ Do this instead:
const { execute: deleteItem, error } = useApiLazy(() => "/items", {
  method: "delete",
  errorContext: "Delete Item",
});

async function goodFunction(id: string) {
  await deleteItem({ id });
  
  if (error.value) {
    return; // Error already handled automatically
  }
  
  // Success handling only
  toast.add({ title: "Success" });
}
```

## Summary

- Use `useApi` when you need SSR support or automatic fetching
- Use `useApiLazy` for manual control and client-side operations
- Always provide `errorContext` for better error messages
- Keep composables at setup level, not inside functions
- Use computed refs for reactive parameters
