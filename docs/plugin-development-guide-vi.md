# Hướng Dẫn Phát Triển Plugin - Enfyra CMS

## Tổng Quan

Plugin system của Enfyra CMS cho phép bạn tạo các component Vue độc lập có thể được upload và tích hợp vào hệ thống mà không cần rebuild toàn bộ ứng dụng.

## Cấu Trúc Plugin

### 1. Cấu Trúc Thư Mục

```
my-plugin/
├── registry.json      # Metadata của plugin
└── plugin.vue         # Component chính
```

### 2. File `registry.json`

```json
{
  "id": "my-plugin",
  "type": "page",
  "active": true,
  "description": "Mô tả plugin của bạn",
  "registration": {
    "miniSidebar": {
      "id": "settings",
      "label": "Settings",
      "icon": "heroicons:cog-6-tooth",
      "route": "/settings"
    },
    "menuItem": {
      "label": "My Plugin",
      "icon": "i-heroicons-star",
      "route": "/settings/my-plugin",
      "sidebarId": "settings"
    }
  }
}
```

#### Các Trường Bắt Buộc:

- **`id`**: Tên unique của plugin (string, không được trùng, nếu upload trùng nó sẽ replace cái đang có)
- **`type`**: Loại plugin (`"page"` hoặc `"widget"`)
- **`active`**: Trạng thái kích hoạt (`true`/`false`)
- **`description`**: Mô tả plugin

#### Registration (cho type "page"):

- **`miniSidebar`**: Cấu hình sidebar section

  - `id`: ID của sidebar section
  - `label`: Tên hiển thị
  - `icon`: Icon (Heroicons format)
  - `route`: Route base của section

- **`menuItem`**: Cấu hình menu item
  - `label`: Tên menu
  - `icon`: Icon của menu item
  - `route`: Route đầy đủ của plugin
  - `sidebarId`: ID sidebar mà menu thuộc về

### 3. File `plugin.vue`

```vue
<template>
  <div class="p-8">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-white mb-4">My Plugin</h1>
        <p class="text-gray-400 text-lg">Plugin description</p>
      </div>

      <div class="space-y-8">
        <!-- UI Components -->
        <div class="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <h3 class="text-xl font-semibold text-white mb-6">Actions</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <component :is="UButton" @click="handleAction" block>
              Action Button
            </component>
          </div>
        </div>

        <!-- Permission Gate -->
        <div class="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <h3 class="text-xl font-semibold text-white mb-6">
            Protected Content
          </h3>
          <component :is="PermissionGate" :condition="{ allowAll: true }">
            <div
              class="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-300"
            >
              ✅ Bạn có quyền truy cập nội dung này
            </div>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props nhận từ hệ thống
const props = defineProps({
  ui: Object, // UI Components (UButton, UCard, etc.)
  components: Object, // Custom Components (PermissionGate)
});

// Extract components để sử dụng
const { UButton, UCard, UBadge, UIcon, UInput, UAlert } = props.ui || {};
const { PermissionGate } = props.components || {};

// Sử dụng composables (đã được inject globally)
const route = useRoute();
const router = useRouter();
const toast = useToast();
const { me } = useAuth();

// Các functions
const handleAction = () => {
  toast.add({
    title: "Success",
    description: "Action completed successfully!",
    color: "success",
  });
};

// Register header actions
useHeaderActionRegistry({
  id: "my-plugin-action",
  label: "My Action",
  icon: "i-heroicons-star",
  variant: "solid",
  color: "primary",
  onClick: handleAction,
});
</script>
```

## Injected Composables

### Vue Composition API

Tất cả Vue Composition API đã được inject globally:

```typescript
// Reactivity
const data = ref(0);
const computed = computed(() => data.value * 2);
const state = reactive({ count: 0 });

// Lifecycle
onMounted(() => {
  console.log("Plugin mounted");
});

onUnmounted(() => {
  console.log("Plugin unmounted");
});

// Watchers
watch(data, (newVal) => {
  console.log("Data changed:", newVal);
});
```

### Nuxt Composables

Các Nuxt composables phổ biến:

```typescript
// Navigation
const route = useRoute();
const router = useRouter();
await navigateTo("/some-route");

// State
const user = useState("user", () => ({}));
const theme = useCookie("theme");

// API
const { data } = await useFetch("/api/endpoint");
const result = await useAsyncData("key", () => $fetch("/api/data"));

// SEO
useHead({
  title: "Plugin Page",
});

useSeoMeta({
  description: "Plugin description",
});
```

### Enfyra CMS Composables

#### `useAuth()`

```typescript
const { me } = useAuth();

// Current user data
console.log(me.value); // User object or null
```

#### `useApi()` / `useApiLazy()`

```typescript
// Auto-executing API call
const { data, pending, error, execute } = useApi(() => "/users", {
  query: { limit: 10 },
  errorContext: "Fetch Users",
});

// Manual execution
const { data, pending, error, execute } = useApiLazy(() => "/users", {
  method: "post",
  errorContext: "Create User",
});

await execute({ body: { name: "John" } });
```

#### `useToast()`

```typescript
const toast = useToast();

toast.add({
  title: "Success",
  description: "Operation completed",
  color: "success", // success, error, primary
});
```

#### `useHeaderActionRegistry()`

```typescript
// Single action
useHeaderActionRegistry({
  id: "my-action",
  label: "My Button",
  icon: "i-heroicons-plus",
  variant: "solid",
  color: "primary",
  onClick: () => console.log("Clicked!"),
});

// Multiple actions
useHeaderActionRegistry([
  {
    id: "action-1",
    label: "Action 1",
    icon: "i-heroicons-star",
    onClick: () => {},
  },
  {
    id: "action-2",
    label: "Action 2",
    icon: "i-heroicons-heart",
    onClick: () => {},
  },
]);
```

#### `usePermissions()`

```typescript
const { checkPermissionCondition } = usePermissions();

const canEdit = checkPermissionCondition({
  and: [{ route: "/users", actions: ["update"] }],
});
```

## Available UI Components

### Nuxt UI Components

Tất cả các component này available qua `props.ui`:

```typescript
// Buttons & Actions
UButton, UBadge;

// Form Elements
UInput, UTextarea, USelect, UCheckbox;

// Layout & Navigation
UCard, UModal, UPopover, UTooltip;

// Display
UIcon, UAlert, UAvatar, UProgress;

// Data
UTable, UPagination, UBreadcrumb;

// Organizing
UTabs, UAccordion;
```

### Custom Components

Available qua `props.components`:

```typescript
// Permission System
PermissionGate;
```

### Sử Dụng Components

```vue
<template>
  <!-- Buttons -->
  <component :is="UButton" @click="action" color="primary">
    Click Me
  </component>

  <!-- Cards -->
  <component :is="UCard">
    <template #header>
      <h3>Card Title</h3>
    </template>
    Card content here
  </component>

  <!-- Icons -->
  <component :is="UIcon" name="i-heroicons-star" class="w-6 h-6" />

  <!-- Forms -->
  <component :is="UInput" v-model="inputValue" placeholder="Enter text" />

  <!-- Permission Gates -->
  <component :is="PermissionGate" :condition="{ allowAll: true }">
    <div>Protected content</div>
  </component>
</template>
```

## Types & Interfaces

### Toast Colors

```typescript
type ToastColor = "success" | "error" | "primary";
```

### Permission Conditions

```typescript
interface PermissionCondition {
  and?: PermissionRule[];
  or?: PermissionRule[];
  allowAll?: boolean;
}

interface PermissionRule {
  route: string;
  actions: string[];
}
```

### Header Action

```typescript
interface HeaderAction {
  id: string;
  label: string;
  icon?: string;
  variant?: "solid" | "outline" | "ghost";
  color?: "primary" | "secondary" | "success" | "error";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  to?: string;
  permission?: PermissionCondition;
}
```

## Styling

Plugin hỗ trợ đầy đủ **Tailwind CSS** cho styling. Bạn có thể sử dụng tất cả Tailwind utility classes như bình thường.

Ví dụ:

```vue
<template>
  <div class="p-8 bg-gray-800 rounded-lg border border-gray-700">
    <h1 class="text-2xl font-bold text-white mb-4">Plugin Title</h1>
    <p class="text-gray-400">Plugin content</p>
  </div>
</template>
```

## Best Practices

### 1. API & Error Handling

Sử dụng `useApi` và `useApiLazy` để xử lý API calls và error handling tự động.
Xem chi tiết tại: **[API Composables Guide](./api-composables.md)**

### 2. Responsive Design

```vue
<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Responsive grid -->
  </div>
</template>
```

### 3. Accessibility

```vue
<template>
  <!-- Proper aria labels -->
  <component :is="UButton" :aria-label="buttonLabel" :disabled="loading">
    {{ loading ? "Loading..." : "Submit" }}
  </component>
</template>
```

## Packaging & Upload

### 1. Tạo ZIP File

Zip 2 file `registry.json` và `plugin.vue` lại với nhau.

### 2. Upload qua UI

1. Vào **Settings > Plugin Manager**
2. Click nút **Upload Plugin** (+ button)
3. Chọn file `.zip`
4. Upload và đợi build hoàn thành

### 3. Debugging

- Check browser console để xem injection logs
- Kiểm tra Network tab để verify plugin files được serve
- Sử dụng Vue DevTools để debug component state

## Ví Dụ Hoàn Chỉnh

Xem file `enfyra-plugin/test-plugin/` để có ví dụ hoàn chỉnh về:

- Cấu trúc plugin đầy đủ
- Sử dụng tất cả composables
- Dark theme styling
- Error handling
- Header action registration
- Permission gates

## Troubleshooting

### Plugin không load

- Kiểm tra `registry.json` syntax
- Verify `type` field đúng format
- Check console errors

### Components không hiển thị

- Kiểm tra `props.ui` và `props.components` destructuring
- Verify component syntax: `<component :is="UButton">`
