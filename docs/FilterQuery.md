# FilterQuery Composable Documentation

`useFilterQuery` is a powerful composable for building and managing data filters in Enfyra CMS.

## Overview

This composable allows building complex filter queries with:
- Support for multiple filter conditions
- Logic operators (AND/OR)
- Nested fields (relations)
- Various operator types

## Data Structures

### FilterCondition
```typescript
interface FilterCondition {
  id: string;
  field: string;      // Field name to filter
  operator: string;   // Operator (_eq, _neq, _gt, _contains, etc.)
  value: any;         // Value to compare
  type?: string;      // Field data type
}
```

### FilterGroup
```typescript
interface FilterGroup {
  id: string;
  operator: "and" | "or";                    // Logic operator
  conditions: (FilterCondition | FilterGroup)[]; // Array of conditions or nested groups
  relationContext?: string;                  // Context for relations
}
```

## Main Methods

### 1. `buildQuery(filter: FilterGroup)`

Converts FilterGroup into query object for API.

```typescript
const { buildQuery } = useFilterQuery();

const filter = {
  operator: "and",
  conditions: [
    { field: "name", operator: "_contains", value: "John" },
    { field: "age", operator: "_gt", value: 18 }
  ]
};

const query = buildQuery(filter);
// Result: { _and: [{ name: { _contains: "John" } }, { age: { _gt: 18 } }] }
```

### 2. `createEmptyFilter()`

Creates a new empty filter.

```typescript
const { createEmptyFilter } = useFilterQuery();

const emptyFilter = createEmptyFilter();
// Result: { id: "...", operator: "and", conditions: [] }
```

### 3. `hasActiveFilters(filter: FilterGroup)`

Checks if filter has any active conditions.

```typescript
const { hasActiveFilters } = useFilterQuery();

const isActive = hasActiveFilters(filter);
// true if has conditions, false if empty
```

## Supported Operators

### Basic Comparison
- `_eq` - Equals
- `_neq` - Not equals
- `_gt` - Greater than
- `_gte` - Greater than or equal
- `_lt` - Less than
- `_lte` - Less than or equal

### Text operators
- `_contains` - Contains string
- `_starts_with` - Starts with
- `_ends_with` - Ends with

### Array operators
- `_in` - In array
- `_not_in` - Not in array

### Special operators
- `_is_null` - Is null
- `_between` - Between (requires array of 2 values)

## Usage Examples

### 1. Simple Filter

```typescript
const { buildQuery, createEmptyFilter } = useFilterQuery();

const filter = createEmptyFilter();
filter.conditions.push({
  id: "1",
  field: "status",
  operator: "_eq",
  value: "active"
});

const query = buildQuery(filter);
// Result: { status: { _eq: "active" } }
```

### 2. Multiple Conditions Filter

```typescript
const filter = {
  operator: "and",
  conditions: [
    { field: "age", operator: "_gte", value: 18 },
    { field: "city", operator: "_eq", value: "HCM" }
  ]
};

const query = buildQuery(filter);
// Result: { _and: [{ age: { _gte: 18 } }, { city: { _eq: "HCM" } }] }
```

### 3. OR Logic Filter

```typescript
const filter = {
  operator: "or",
  conditions: [
    { field: "status", operator: "_eq", value: "active" },
    { field: "status", operator: "_eq", value: "pending" }
  ]
};

const query = buildQuery(filter);
// Result: { _or: [{ status: { _eq: "active" } }, { status: { _eq: "pending" } }] }
```

### 4. Nested Fields Filter (Relations)

```typescript
const filter = {
  operator: "and",
  conditions: [
    { field: "user.profile.name", operator: "_contains", value: "John" },
    { field: "user.role", operator: "_eq", value: "admin" }
  ]
};

const query = buildQuery(filter);
// Result: { 
//   _and: [
//     { user: { profile: { name: { _contains: "John" } } } },
//     { user: { role: { _eq: "admin" } } }
//   ]
// }
```

### 5. Between Filter

```typescript
const filter = {
  conditions: [
    { field: "createdAt", operator: "_between", value: ["2024-01-01", "2024-12-31"] }
  ]
};

const query = buildQuery(filter);
// Result: { createdAt: { _between: ["2024-01-01", "2024-12-31"] } }
```

### 6. In Array Filter

```typescript
const filter = {
  conditions: [
    { field: "category", operator: "_in", value: ["tech", "news", "sports"] }
  ]
};

const query = buildQuery(filter);
// Result: { category: { _in: ["tech", "news", "sports"] } }
```

## Usage in Components

### In Data Listing Page

```vue
<script setup>
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();

const currentFilter = ref(createEmptyFilter());

// API call with filter
const { data: apiData } = useApiLazy(() => `/${tableName}`, {
  query: computed(() => {
    const filterQuery = hasActiveFilters(currentFilter.value)
      ? buildQuery(currentFilter.value)
      : {};

    return {
      limit: 10,
      page: 1,
      ...(Object.keys(filterQuery).length > 0 && { filter: filterQuery }),
    };
  }),
});
</script>
```

### With FilterDrawer Component

```vue
<template>
  <FilterDrawer
    v-model="showFilterDrawer"
    v-model:filter-value="currentFilter"
    :schemas="schemas"
    :table-name="tableName"
    @apply="applyFilters"
    @clear="clearFilters"
  />
</template>

<script setup>
function applyFilters() {
  // Filter will automatically apply through reactive query
  showFilterDrawer.value = false;
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
}
</script>
```

## URL Integration

### Encode/Decode Filter from URL

```typescript
const { encodeFilterToUrl, parseFilterFromUrl } = useFilterQuery();

// Save filter to URL
const filterString = encodeFilterToUrl(currentFilter.value);
router.push({ query: { filter: filterString } });

// Read filter from URL
const urlFilter = parseFilterFromUrl(new URLSearchParams(window.location.search));
if (urlFilter) {
  currentFilter.value = urlFilter;
}
```

## Tips and Best Practices

1. **Always check active filters**: Use `hasActiveFilters()` to avoid sending empty queries
2. **Handle nested fields**: Use dot notation for relations (`user.profile.name`)
3. **Validate values**: Ensure values match the operator (array for `_in`, 2 values for `_between`)
4. **Performance**: Only send filters when necessary, use computed for reactive queries

## Usage Notes

- `_is_null` operator doesn't need a value
- Array operators (`_in`, `_not_in`) automatically convert single values to arrays
- `_between` requires an array with exactly 2 elements
- Nested fields support unlimited depth with dot notation