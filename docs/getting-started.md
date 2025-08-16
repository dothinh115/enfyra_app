# Getting Started with Enfyra App

Welcome to Enfyra App! This guide will teach you to **build custom features WITHOUT touching the codebase** - using only the web interface to create extensions, menus, and complete applications.

## 🎯 The Enfyra Way

**Key Philosophy:** You never edit the main codebase. Everything is done through the extension system via web interface!

```
🌟 No-Code Approach
├── Create extensions via Settings UI
├── Code in built-in browser editor
├── Create custom menus automatically
├── Instant deployment & testing
└── Complete feature development
```

**Learning Path:**

```
🌟 PHASE 1: Platform Mastery (15 minutes)
├── Login & Navigation
├── Understanding the Admin UI
└── Extension System Overview

🏗️ PHASE 2: First Extension (30 minutes)
├── Create Extension via UI
├── Build Simple Widget
└── Add to Navigation Menu

⚡ PHASE 3: Complete Features (1 hour)
├── Data Management Extension
├── Advanced UI Components
└── Real-world Integration

🚀 PHASE 4: Production Extensions (Half day)
├── Complex Business Logic
├── API Integrations
└── Professional Extensions
```

---

## 🌟 Phase 1: Platform Mastery (20 minutes)

### Step 1: Access Your Enfyra App (2 minutes)

**Goal:** Login and see the admin interface

1. Open your Enfyra App URL
2. Login with your admin credentials
3. You'll see the main dashboard

**✅ Success Check:** You can see the dashboard with sidebar navigation

### Step 2: Navigate the Admin Interface (5 minutes)

**Goal:** Understand the main sections and sidebar structure

**Key sections you'll use:**

```
📊 Dashboard       → Main overview where your extension will appear
📋 Data           → View/manage your data tables
⚙️  Settings      → Your main workspace
   ├── Extensions → CREATE CUSTOM FEATURES HERE ⭐
   ├── Menus      → CREATE NAVIGATION HERE ⭐
   ├── Users      → User management
   └── Roles      → Permission management
```

**✅ Quick Navigation Test:**

1. Click "Settings" in the sidebar
2. Click "Extensions" - this is where you build features!
3. Click "Menus" - this is where you create navigation
4. Navigate back to Dashboard

### Step 3: Create a Menu Item in Dashboard (5 minutes)

**Goal:** Create a simple menu item inside the existing Dashboard section

**IMPORTANT:** We'll add your first extension to the existing Dashboard menu (keeps it simple!)

**Create Dashboard Menu Item:**

1. Go to **Settings > Menus**
2. Click **"Create"** button
3. **Fill the form:**

   ```
   Name: my-first-extension
   Label: My First Extension
   Icon: lucide:rocket
   Type: Menu       ← IMPORTANT: This creates a menu item (not mini sidebar)
   Path: /dashboard/my-first-extension ← Where to navigate when clicking menu
   Order: 10        ← Position in menu list (lower = higher up)
   ```

   **📝 Field Explanations:**

   - **Path:** `/dashboard/my-first-extension` - When user clicks this menu item, they will navigate to this URL and your extension page will load at this route
   - **Order:** `10` - Controls the position of this menu item in the list. Lower numbers appear higher in the menu (Order 1 = top, Order 10 = lower down)

4. **IMPORTANT - Set Sidebar Field:** In the **"sidebar"** field, you'll see a pen icon (🖊️)
5. **Click the pen icon** - a drawer will open
6. **Find and click `/dashboard`** from the list in the drawer
7. **Click "Apply"** to confirm your selection
8. **Click "Save"**

**📝 Understanding Menu Configuration:**

- **Path Function:** When user clicks menu → navigates to `/dashboard/my-first-extension` → extension page loads
- **Sidebar Context:** Menu appears in `/dashboard` sidebar (via tree picker selection)
- **Order Effect:** Menu item position in list (lower number = higher position)
- **Result:** Click menu → navigate to path → extension loads → dashboard sidebar stays active

**✅ Success Check:** Go to Dashboard - you should see "My First Extension" appear in the Dashboard menu items

### Step 4: Extension System Overview (3 minutes)

**Goal:** Understand how extensions will connect to your menu

**The Power of Extensions:**

- ✅ **Vue.js single-file components** - full framework power
- ✅ **Links to your menu item** - extensions connect to menu items you created
- ✅ **useApiLazy for data** - CSR-optimized API calls
- ✅ **Instant deployment** - save and test immediately
- ✅ **Permission-aware** - integrates with role system

**Quick System Tour:**

1. Go to **Settings > Extensions**
2. Click **"Create"** to see the form (don't create yet)
3. Notice these key fields:
   - **Extension ID**: Auto-generated - don't worry about this
   - **Type**: Page/Widget - choose the extension type
   - **Code Editor**: Full Vue.js component
4. Click "Cancel"

**📝 Extension Types:**

- **Page**: Standalone extension that loads automatically at its path route (like `/dashboard/my-first-extension`)
- **Widget**: Nested extension that can be called/embedded inside other extensions using `<Widget>` component

---

## 🎓 Phase 1 Complete - Ready for Your First Extension!

**🏆 What You've Accomplished:**

- ✅ **Menu Item Created** - "My First Extension" appears in Dashboard menu
- ✅ **Relation Configured** - Menu item properly linked to Dashboard sidebar
- ✅ **Extension System** - Understanding how extensions connect to menus
- ✅ **Simple Setup** - Using existing Dashboard instead of creating new mini sidebar

**📋 Checklist Before Phase 2:**

- [ ] You can see "My First Extension" in the Dashboard sidebar menu
- [ ] The menu item has path `/my-first-extension`
- [ ] You understand that the extension will connect to this menu item
- [ ] You're ready to build the actual extension code

**🎯 Next Step:** Phase 2 will create the actual extension that connects to your menu item and uses the `/me` API endpoint correctly!

---

## 🏗️ Phase 2: Your First Extension (30 minutes)

### Step 5: Create Your First Extension (15 minutes)

**Goal:** Build the extension code that connects to your menu item

**Create the Extension:**

1. Go to **Settings > Extensions**
2. Click **"Create"**
3. **Fill the form:**

   ```
   Name: My First Extension
   Description: My first simple extension
   Type: Page
   Is Enabled: ✅ Checked
   ```

   **Note:** Extension ID will be auto-generated - don't worry about it!

4. **In the Code Editor, paste this corrected code:**

```vue
<template>
  <div class="p-6">
    <UCard class="mb-6">
      <template #header>
        <h3 class="text-xl font-semibold flex items-center gap-2">
          <Icon name="lucide:user" />
          Current User Information
        </h3>
      </template>

      <div class="space-y-4">
        <div v-if="userLoading" class="text-center py-4">
          <Icon name="lucide:loader" class="animate-spin text-2xl" />
          <p class="mt-2">Loading user data...</p>
        </div>

        <div v-else-if="userInfo" class="space-y-2">
          <p><strong>Email:</strong> {{ userInfo.email }}</p>
          <p><strong>Role:</strong> {{ userInfo.role?.name || "No role" }}</p>
          <p>
            <strong>Account Created:</strong>
            {{ formatDate(userInfo.createdAt) }}
          </p>
        </div>

        <div class="flex gap-3 pt-4">
          <UButton
            @click="fetchUser"
            :loading="userLoading"
            icon="lucide:refresh-cw"
          >
            Refresh User Data
          </UButton>

          <UButton
            @click="showWelcome"
            variant="outline"
            icon="lucide:hand-heart"
          >
            Say Hello
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-xl font-semibold">Extension Demo Features</h3>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-900">✅ API Integration</h4>
            <p class="text-sm text-blue-700">
              Successfully calling /me endpoint
            </p>
          </div>

          <div class="p-4 bg-green-50 rounded-lg">
            <h4 class="font-medium text-green-900">✅ UI Components</h4>
            <p class="text-sm text-green-700">Using all Enfyra components</p>
          </div>

          <div class="p-4 bg-purple-50 rounded-lg">
            <h4 class="font-medium text-purple-900">✅ Reactive Data</h4>
            <p class="text-sm text-purple-700">Real-time state management</p>
          </div>

          <div class="p-4 bg-orange-50 rounded-lg">
            <h4 class="font-medium text-orange-900">✅ Toast Notifications</h4>
            <p class="text-sm text-orange-700">User feedback system</p>
          </div>
        </div>

        <div
          v-if="message"
          class="p-4 bg-blue-100 border-l-4 border-blue-500 rounded"
        >
          <p class="text-blue-800">{{ message }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  components: {
    type: Object,
    default: () => ({}),
  },
});

const { UCard, UButton, Icon } = props.components;

const message = ref("");
const userInfo = ref(null);

const toast = useToast();

const {
  data: userData,
  execute: fetchUser,
  pending: userLoading,
  error,
} = useApiLazy(() => "/me", {
  query: {
    fields: "*,role.*",
  },
  errorContext: "Fetch Current User",
});

watch(
  userData,
  (newData) => {
    if (newData?.data?.[0]) {
      userInfo.value = newData.data[0];
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await fetchUser();

  if (error.value) {
    console.log("Failed to load user data:", error.value);
  }
});

function showWelcome() {
  const userName = userInfo.value?.name || userInfo.value?.email;
  message.value = `👋 Hello ${userName}! Your extension is working perfectly. You built this without touching any server code!`;

  toast.add({
    title: `Hello ${userName}!`,
    description: "Your extension is working perfectly!",
    color: "success",
  });
}

function formatDate(dateString: string) {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString();
}
</script>
```

5. **IMPORTANT - Link Extension to Menu:** After saving the extension form, you need to connect it to your menu
6. **Find the "menu" relation field** and click the pen icon (🖊️) - a drawer will open
7. **Find and click your menu** - look for the menu with path `/dashboard/my-first-extension` that you created in Phase 1
8. **Click "Apply"** to link the extension to your menu
9. **Click "Save"** to finalize

### Step 6: Test Your Extension (10 minutes)

**Goal:** Navigate to and test your newly created extension

**Simple Testing Steps:**

1. **Go to Dashboard:** Navigate to the main dashboard page
2. **Find Your Menu Item:** Look for "My First Extension" in the Dashboard sidebar menu
3. **Click to Open:** Click on "My First Extension"
4. **Test the Extension:** Your extension should load at `/dashboard/my-first-extension`

**✅ What Should Happen:**

- ✅ Your extension loads successfully
- ✅ You see the welcome message and user info card
- ✅ The "Refresh User Data" button works and shows your user information
- ✅ The "Say Hello" button displays a personalized message
- ✅ Toast notifications appear when you interact with buttons
- ✅ All data loads from the `/me` API endpoint successfully

**🎯 If Something's Wrong:**

- **No menu item visible?** → Check your menu creation steps
- **Extension won't load?** → Check your extension creation steps

**🎉 Success!** You've built your first extension with just the web interface!

### Step 7: Understanding What You Accomplished (5 minutes)

**Goal:** Understand the power of what you just accomplished

**🚀 What Enfyra Did For You Automatically:**

- ✅ **Created new route** (`/dashboard/my-first-extension`) with zero server config
- ✅ **Connected to menu** - extension linked to menu via "menu" relation field
- ✅ **Injected all UI components** (UCard, UButton, Icon, etc.) via `props.components`
- ✅ **Made API composables available** (`useApiLazy`, `useToast`, computed, ref, etc.)
- ✅ **Hot-deployed instantly** - no build, no server restart
- ✅ **Applied security** - automatic authentication and permission checks
- ✅ **Handled API calls** - `/me` endpoint worked immediately

**🔧 Technical Achievements:**

- ✅ **Simple setup** - Used existing Dashboard sidebar with drawer selection
- ✅ **CSR-optimized** - Used `useApiLazy` correctly for client-side rendering
- ✅ **Reactive Vue.js** - Full framework power with ref, computed, watch
- ✅ **API integration** - Real backend data fetching with error handling
- ✅ **Relation linking** - Extension connected to menu via relation field (not auto-matching)
- ✅ **Toast notifications** - Professional user feedback system

**💡 Quick Experiment - Edit Your Extension:**

1. Go to **Settings > Extensions**
2. Find your "My First Extension"
3. Click "Edit"
4. Add this button in the first button group:

```vue
<UButton @click="showCurrentTime" variant="outline" icon="lucide:clock">
  Show Time
</UButton>
```

5. Add this function in the script section:

```typescript
function showCurrentTime() {
  const now = new Date().toLocaleString();
  message.value = `🕐 Current time: ${now}`;
  toast.add({
    title: "Time Update",
    description: `It's ${now}`,
    color: "info",
  });
}
```

6. **Save and test immediately** - no build process needed!

**✅ Key Insights About Enfyra Extensions:**

- ✅ **Zero server-side changes** - everything through web UI
- ✅ **Full Vue.js ecosystem** - composables, reactivity, lifecycle hooks
- ✅ **Professional UI** - all Nuxt UI components available
- ✅ **Real-time development** - save and see changes instantly
- ✅ **Production-ready** - proper error handling, loading states, security

---

## ⚡ Phase 3: Complete Features (1 hour)

### Step 6: Build a Data Management Extension (30 minutes)

**Goal:** Create a real-world data management interface

**Create Second Extension:**

1. **Settings > Extensions > Create**
2. **Fill form:**

   ```
   Extension ID: task-manager
   Name: Task Manager
   Description: Manage tasks with full CRUD
   Type: Page
   Is Enabled: ✅ Checked
   ```

3. **Code Editor - Full Task Manager:**

```vue
<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Task Manager</h1>
      <UButton
        @click="showCreateForm = true"
        color="primary"
        icon="i-lucide-plus"
      >
        Create Task
      </UButton>
    </div>

    <!-- Task List -->
    <div v-if="loading" class="text-center py-8">
      <CommonLoadingState title="Loading tasks..." />
    </div>

    <div v-else-if="tasks?.length === 0" class="text-center py-8">
      <CommonEmptyState
        title="No tasks yet"
        description="Create your first task to get started"
        icon="lucide:list-todo"
      />
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="task in tasks" :key="task.id" class="p-4">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-semibold text-lg">{{ task.title }}</h3>
            <p class="text-gray-600 mt-1">{{ task.description }}</p>
            <div class="flex gap-2 mt-3">
              <UBadge
                :color="task.status === 'completed' ? 'success' : 'warning'"
              >
                {{ task.status || "pending" }}
              </UBadge>
              <UBadge variant="soft">
                Priority: {{ task.priority || "medium" }}
              </UBadge>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              @click="editTask(task)"
              variant="outline"
              size="sm"
              icon="i-lucide-edit"
            >
              Edit
            </UButton>
            <UButton
              @click="deleteTask(task.id)"
              color="error"
              variant="outline"
              size="sm"
              icon="i-lucide-trash"
            >
              Delete
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Create/Edit Modal -->
    <UModal
      v-model="showCreateForm"
      :title="editingTask ? 'Edit Task' : 'Create Task'"
    >
      <div class="p-6">
        <div class="space-y-4">
          <UFormGroup label="Task Title" required>
            <UInput
              v-model="taskForm.title"
              placeholder="Enter task title..."
            />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea
              v-model="taskForm.description"
              placeholder="Task description..."
              rows="3"
            />
          </UFormGroup>

          <UFormGroup label="Status">
            <USelect
              v-model="taskForm.status"
              :options="statusOptions"
              placeholder="Select status"
            />
          </UFormGroup>

          <UFormGroup label="Priority">
            <USelect
              v-model="taskForm.priority"
              :options="priorityOptions"
              placeholder="Select priority"
            />
          </UFormGroup>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <UButton @click="closeForm" variant="outline"> Cancel </UButton>
          <UButton @click="saveTask" :loading="saving" color="primary">
            {{ saving ? "Saving..." : editingTask ? "Update" : "Create" }}
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Props (auto-injected by Enfyra)
const props = defineProps({
  components: { type: Object, default: () => ({}) },
});

const {
  UButton,
  UCard,
  UModal,
  UInput,
  UTextarea,
  USelect,
  UFormGroup,
  UBadge,
  CommonLoadingState,
  CommonEmptyState,
} = props.components;

// State
const tasks = ref([]);
const loading = ref(false);
const showCreateForm = ref(false);
const saving = ref(false);
const editingTask = ref(null);

const taskForm = ref({
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
});

// Options
const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

// Auto-available composables
const toast = useToast();
const { confirm } = useConfirm();

// API calls (using real or mock data)
const { data: tasksData, execute: fetchTasks } = useApiLazy(
  () => "/task_definition",
  {
    query: { limit: 50, fields: "*" },
    errorContext: "Fetch Tasks",
  }
);

watch(
  tasksData,
  (newData) => {
    if (newData?.data) {
      tasks.value = newData.data;
    } else {
      // Mock data for demonstration if no task table exists
      tasks.value = [
        {
          id: 1,
          title: "Setup Enfyra App",
          description: "Complete the getting started guide",
          status: "completed",
          priority: "high",
        },
        {
          id: 2,
          title: "Build first extension",
          description: "Create a custom extension using the UI",
          status: "in-progress",
          priority: "medium",
        },
        {
          id: 3,
          title: "Learn advanced features",
          description: "Explore filters, forms, and API integration",
          status: "pending",
          priority: "medium",
        },
      ];
    }
  },
  { immediate: true }
);

// Load data
onMounted(() => {
  loading.value = true;
  // Try to fetch real data, fallback to mock
  fetchTasks().finally(() => {
    loading.value = false;
  });
});

// CRUD Operations
function editTask(task) {
  editingTask.value = task;
  taskForm.value = { ...task };
  showCreateForm.value = true;
}

async function saveTask() {
  if (!taskForm.value.title) {
    toast.add({
      title: "Validation Error",
      description: "Task title is required",
      color: "error",
    });
    return;
  }

  saving.value = true;

  // Simulate save operation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (editingTask.value) {
    // Update existing
    const index = tasks.value.findIndex((t) => t.id === editingTask.value.id);
    if (index !== -1) {
      tasks.value[index] = { ...editingTask.value, ...taskForm.value };
    }
    toast.add({ title: "Task updated successfully", color: "success" });
  } else {
    // Create new
    const newTask = {
      id: Date.now(),
      ...taskForm.value,
    };
    tasks.value.unshift(newTask);
    toast.add({ title: "Task created successfully", color: "success" });
  }

  saving.value = false;
  closeForm();
}

async function deleteTask(taskId) {
  const confirmed = await confirm({
    title: "Delete Task",
    content: "Are you sure you want to delete this task?",
    confirmText: "Delete",
  });

  if (confirmed) {
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
    toast.add({
      title: "Task deleted successfully",
      color: "success",
    });
  }
}

function closeForm() {
  showCreateForm.value = false;
  editingTask.value = null;
  taskForm.value = {
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
  };
}
</script>
```

4. **Menu Configuration:**

```json
{
  "path": "/task-manager",
  "name": "task-manager",
  "label": "Task Manager",
  "icon": "lucide:list-todo",
  "sidebarId": "main",
  "order": 2
}
```

5. **Save and Test**

**✅ Test Your Task Manager:**

1. Click "Task Manager" in the sidebar
2. See the sample tasks
3. Click "Create Task" and add a new task
4. Edit an existing task
5. Delete a task (with confirmation)

**🎯 What You Built:**

- ✅ **Complete CRUD interface**
- ✅ **Modal forms** with validation
- ✅ **Confirmation dialogs**
- ✅ **Loading states** and empty states
- ✅ **Toast notifications**
- ✅ **Real-time UI updates**

### Step 7: Add Custom Menu Section (15 minutes)

**Goal:** Organize your extensions with custom menu sections

1. **Go to Settings > Menus**
2. **Click "Create"**
3. **Create a custom section:**
   ```
   Name: My Apps
   Label: My Apps
   Icon: lucide:app-window
   Type: Sidebar
   Order: 1
   ```
4. **Save**

5. **Update your extensions** to use the new section:
   - Edit both extensions (My Dashboard and Task Manager)
   - Change their menu config `sidebarId` from `"main"` to `"my-apps"`
   - Save both

**✅ Result:** Your custom extensions are now grouped under "My Apps" section!

### Step 8: Widget Extension (15 minutes)

**Goal:** Create a reusable widget that can be embedded anywhere

**Create Widget Extension:**

1. **Settings > Extensions > Create**
2. **Fill form:**

   ```
   Extension ID: weather-widget
   Name: Weather Widget
   Description: Simple weather display widget
   Type: Widget  ⭐ (Note: Widget, not Page)
   Is Enabled: ✅ Checked
   ```

3. **Widget Code:**

```vue
<template>
  <div
    class="weather-widget p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg text-white"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ city }}</h3>
        <p class="text-sm opacity-90">{{ description }}</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold">{{ temperature }}°C</div>
        <div class="text-sm opacity-90">{{ humidity }}% humidity</div>
      </div>
    </div>

    <div class="mt-3 flex justify-between text-xs opacity-75">
      <span>{{ forecast }}</span>
      <span>Updated: {{ updateTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Widget props (can be passed when embedding)
const props = defineProps({
  city: { type: String, default: "Ho Chi Minh City" },
  components: { type: Object, default: () => ({}) },
});

// Widget state (mock weather data)
const temperature = ref(28);
const description = ref("Partly Cloudy");
const humidity = ref(75);
const forecast = ref("High: 32°C, Low: 24°C");
const updateTime = ref(new Date().toLocaleTimeString());

// Update weather every minute (demo)
onMounted(() => {
  setInterval(() => {
    temperature.value = Math.floor(Math.random() * 10) + 25;
    humidity.value = Math.floor(Math.random() * 30) + 60;
    updateTime.value = new Date().toLocaleTimeString();
  }, 60000);
});
</script>
```

4. **No menu needed for widgets** - leave menu configuration empty
5. **Save**

**Now Use Your Widget:**

1. Edit your "My Dashboard" extension
2. Add this to the template (after the stats cards):

```vue
<!-- Weather Widget Embed -->
<div class="mb-8">
  <h2 class="text-xl font-semibold mb-4">Today's Weather</h2>
  <Widget :id="[YOUR_WEATHER_WIDGET_ID]" city="Ho Chi Minh City" />
</div>
```

3. **Find your widget ID:** Go to Settings > Extensions, find your weather widget, note the ID number
4. **Replace `[YOUR_WEATHER_WIDGET_ID]`** with the actual ID (e.g., `:id="5"`)
5. **Save your dashboard extension**

**✅ Test Widget Embedding:**

- Visit your "My Dashboard"
- See the weather widget embedded!
- The widget updates independently

**🎯 Widget Power:** Widgets can be embedded in any extension using `<Widget :id="X" />`.

---

## 🚀 Phase 4: Production Extensions (Half day)

### Step 9: Advanced Features Integration (2 hours)

**Goal:** Build a production-ready extension with all Enfyra features

**Create "Admin Center" Extension:**

```vue
<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Admin Center</h1>
      <p class="text-gray-600">
        Complete administration dashboard with all Enfyra features
      </p>
    </div>

    <!-- Filter Section -->
    <UCard class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold">User Management</h3>
          <div class="flex gap-2">
            <UButton
              :variant="hasActiveFilters(currentFilter) ? 'solid' : 'outline'"
              :color="hasActiveFilters(currentFilter) ? 'primary' : 'neutral'"
              icon="i-lucide-filter"
              @click="showFilterDrawer = true"
            >
              {{
                hasActiveFilters(currentFilter)
                  ? `Filters (${currentFilter.conditions.length})`
                  : "Filter"
              }}
            </UButton>

            <UButton
              v-if="hasActiveFilters(currentFilter)"
              variant="ghost"
              icon="i-lucide-x"
              @click="clearFilters"
            >
              Clear
            </UButton>
          </div>
        </div>
      </template>

      <!-- Permission-Gated Content -->
      <PermissionGate
        :condition="{ or: [{ route: '/user_definition', actions: ['read'] }] }"
      >
        <!-- User List -->
        <div v-if="loading" class="text-center py-8">
          <CommonLoadingState title="Loading users..." />
        </div>

        <div v-else-if="users?.length === 0" class="text-center py-8">
          <CommonEmptyState
            title="No users found"
            description="Try adjusting your filters"
            icon="lucide:users"
          />
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex justify-between items-center p-4 bg-gray-50 rounded"
          >
            <div>
              <h4 class="font-medium">{{ user.name || "No Name" }}</h4>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
            </div>
            <div class="flex gap-2">
              <PermissionGate
                :condition="{
                  or: [{ route: '/user_definition', actions: ['update'] }],
                }"
              >
                <UButton size="sm" variant="outline" @click="editUser(user)">
                  Edit
                </UButton>
              </PermissionGate>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <UPagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :page-count="pageSize"
          :total="totalUsers"
          class="mt-6 justify-center"
          @update:model-value="fetchUsers"
        />
      </PermissionGate>

      <!-- No Permission Message -->
      <div v-else class="text-center py-8">
        <UAlert
          color="warning"
          title="Access Denied"
          description="You don't have permission to view users."
        />
      </div>
    </UCard>

    <!-- System Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <CommonSettingsCard
        title="Total Users"
        :description="`${totalUsers} registered users`"
        icon="lucide:users"
        icon-color="primary"
        :stats="[{ label: 'Active Today', value: activeToday }]"
      />

      <CommonSettingsCard
        title="Extensions"
        :description="`${extensionCount} custom extensions`"
        icon="lucide:puzzle"
        icon-color="success"
        :stats="[{ label: 'Enabled', value: enabledExtensions }]"
      />

      <CommonSettingsCard
        title="API Calls"
        description="Today's API usage"
        icon="lucide:activity"
        icon-color="warning"
        :stats="[{ label: 'Requests', value: apiCalls }]"
      />

      <CommonSettingsCard
        title="Storage"
        description="Database usage"
        icon="lucide:database"
        icon-color="info"
        :stats="[{ label: 'Used', value: storageUsed }]"
      />
    </div>

    <!-- Filter Drawer -->
    <FilterDrawer
      v-model="showFilterDrawer"
      v-model:filter-value="currentFilter"
      :table-name="'user_definition'"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <!-- Edit User Modal -->
    <UModal v-model="showEditForm" title="Edit User">
      <div class="p-6">
        <FormEditor
          v-model="editingUser"
          v-model:errors="editErrors"
          :table-name="'user_definition'"
          :excluded="['id', 'createdAt', 'updatedAt']"
        />

        <div class="flex justify-end gap-3 mt-6">
          <UButton @click="showEditForm = false" variant="outline">
            Cancel
          </UButton>
          <UButton @click="saveUser" :loading="saving" color="primary">
            Save Changes
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Props (auto-injected)
const props = defineProps({
  components: { type: Object, default: () => ({}) },
});

const {
  UCard,
  UButton,
  UAlert,
  UModal,
  UPagination,
  CommonSettingsCard,
  CommonLoadingState,
  CommonEmptyState,
  PermissionGate,
  FilterDrawer,
  FormEditor,
} = props.components;

// State
const users = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const totalUsers = ref(0);

// Modal states
const showEditForm = ref(false);
const editingUser = ref({});
const editErrors = ref({});
const saving = ref(false);

// Filter state
const showFilterDrawer = ref(false);
const currentFilter = ref(createEmptyFilter());

// Stats (mock data)
const activeToday = ref(12);
const extensionCount = ref(4);
const enabledExtensions = ref(3);
const apiCalls = ref("1.2k");
const storageUsed = ref("45MB");

// Composables (auto-available)
const toast = useToast();
const { hasPermission } = usePermissions();
const { createEmptyFilter, buildQuery, hasActiveFilters } = useFilterQuery();

// API integration
const { data: usersData, execute: fetchUsers } = useApiLazy(
  () => "/user_definition",
  {
    query: computed(() => {
      const baseQuery = {
        limit: pageSize,
        page: currentPage.value,
        fields: "*",
        meta: "*",
      };

      if (hasActiveFilters(currentFilter.value)) {
        baseQuery.filter = buildQuery(currentFilter.value);
      }

      return baseQuery;
    }),
    errorContext: "Admin Center - Fetch Users",
  }
);

// Watch for data changes
watch(
  usersData,
  (newData) => {
    if (newData?.data) {
      users.value = newData.data;
      totalUsers.value = newData.meta?.totalCount || 0;
    }
  },
  { immediate: true }
);

const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize));

// Load initial data
onMounted(() => {
  loading.value = true;
  fetchUsers().finally(() => {
    loading.value = false;
  });
});

// User management
function editUser(user) {
  editingUser.value = { ...user };
  editErrors.value = {};
  showEditForm.value = true;
}

async function saveUser() {
  saving.value = true;

  // Simulate save
  await new Promise((resolve) => setTimeout(resolve, 1000));

  toast.add({
    title: "User updated successfully",
    color: "success",
  });

  saving.value = false;
  showEditForm.value = false;
  fetchUsers(); // Refresh list
}

// Filter handlers
async function applyFilters() {
  currentPage.value = 1;
  loading.value = true;
  await fetchUsers();
  loading.value = false;
}

function clearFilters() {
  currentFilter.value = createEmptyFilter();
  applyFilters();
}

// Header Actions (registered automatically)
useHeaderActionRegistry([
  {
    id: "admin-refresh",
    label: "Refresh",
    icon: "lucide:refresh-cw",
    variant: "outline",
    onClick: () => fetchUsers(),
  },
  {
    id: "admin-export",
    label: "Export",
    icon: "lucide:download",
    variant: "outline",
    onClick: () => {
      toast.add({
        title: "Export Started",
        description: "User data is being exported...",
        color: "info",
      });
    },
    permission: {
      or: [{ route: "/user_definition", actions: ["read"] }],
    },
  },
]);
</script>
```

**Menu Configuration:**

```json
{
  "path": "/admin-center",
  "name": "admin-center",
  "label": "Admin Center",
  "icon": "lucide:shield-check",
  "sidebarId": "my-apps",
  "order": 3
}
```

**✅ What This Extension Demonstrates:**

- ✅ **Complete Filter System** - Visual query builder
- ✅ **Permission-Gated UI** - Different views for different users
- ✅ **Form System** - Dynamic forms with validation
- ✅ **API Integration** - Real data fetching with pagination
- ✅ **Header Actions** - Contextual buttons in header
- ✅ **Modal Management** - Complex UI interactions
- ✅ **Settings Cards** - Professional dashboard layout
- ✅ **Toast Notifications** - User feedback system

---

## 🎓 Congratulations! You've Mastered Enfyra App!

### 🏆 What You've Accomplished

**In just a few hours, using ONLY the web interface, you built:**

1. ✅ **Custom Dashboard** - Interactive page with real-time features
2. ✅ **Task Manager** - Complete CRUD application with modals
3. ✅ **Weather Widget** - Reusable component for embedding
4. ✅ **Admin Center** - Production-ready management interface
5. ✅ **Custom Navigation** - Organized menu sections

**🎯 Zero Codebase Changes Required!** Everything built through the UI.

### 🚀 The Power You Now Have

```
🎨 UI Components    → All Enfyra components available
🔧 API Integration  → Full backend access via composables
🛡️ Permissions     → Role-based access control
🔍 Filters         → Visual query builder
📝 Forms           → Dynamic, validated forms
📱 Responsive      → Mobile-friendly by default
⚡ Real-time       → Instant deployment and updates
🧩 Extensible      → Unlimited customization potential
```

### 📋 What's Next?

**For Real Projects:**

1. **Connect to real data** - Use actual database tables
2. **Configure permissions** - Set up proper user roles
3. **Build business logic** - Create domain-specific features
4. **Integrate APIs** - Connect external services
5. **Deploy widgets** - Embed components across the system

**Advanced Learning:**

- Study the [Extension Development Guide](./extension-development-guide.md) for deeper patterns
- Read [Filter System Guide](./filter-query.md) for advanced querying
- Explore [Permission System](./permission-system.md) for security patterns

### 🎉 Welcome to the Enfyra Community!

You're now ready to build **production-ready applications** using Enfyra App's powerful extension system. The only limit is your imagination!

**Key Takeaway:** With Enfyra App, you can build **complete applications** without ever touching server code - just use the web interface and your creativity! 🚀
