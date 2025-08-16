# 🚀 Getting Started with Enfyra App

Welcome to Enfyra App! Build **complete custom features** without touching any server code - everything through the web interface!

## 🎯 The Enfyra Way

**Key Philosophy:** Zero codebase changes. Everything via web UI!

```
✨ No-Code Development Workflow
├── 🎨 Design extensions in browser editor
├── 🔗 Create navigation menus instantly
├── 🚀 Deploy & test in real-time
└── 🏗️ Build production-ready features
```

**Quick Learning Path:**
- **5 minutes:** Platform overview
- **15 minutes:** First extension
- **30 minutes:** Interactive demo
- **Ready to build anything!**

---

## 🌟 Phase 1: Platform Overview (5 minutes)

### Step 1: Access Your Admin Interface

1. Login to your Enfyra App
2. Navigate the sidebar sections:

```
📊 Dashboard       → Main overview
📋 Data           → Manage your tables  
⚙️  Settings      → Your main workspace
   ├── Extensions → BUILD FEATURES HERE ⭐
   ├── Menus      → CREATE NAVIGATION ⭐
   ├── Users      → User management
   └── Roles      → Permissions
```

### Step 2: Create Your First Menu Item

**Goal:** Add "My Demo" to the Dashboard menu

1. Go to **Settings > Menus > Create**
2. Fill the form:
   - **Name:** `my-demo`
   - **Label:** `My Demo`
   - **Icon:** `lucide:sparkles`
   - **Type:** `Menu`
   - **Path:** `/dashboard/my-demo`
   - **Order:** `10`
3. **Click the pen icon** next to "sidebar" field
4. **Select `/dashboard`** from the drawer
5. **Save**

✅ **Check:** You should see "My Demo" in the Dashboard sidebar menu

---

## 🎨 Phase 2: Your First Extension (15 minutes)

### Step 3: Create the Extension

1. Go to **Settings > Extensions > Create**
2. Fill the form:
   - **Name:** `My Demo Extension`
   - **Type:** `Page`
   - **Is Enabled:** ✅ Checked

3. **Paste this code in the editor:**

```vue
<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        🎉 Welcome to Enfyra!
      </h1>
      <p class="text-gray-600 mt-2">Your first custom extension is working perfectly!</p>
    </div>

    <!-- Interactive Demo Cards -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- User Info Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="text-blue-500" />
            <h3 class="font-semibold">Current User</h3>
          </div>
        </template>

        <div class="space-y-3">
          <div v-if="loading" class="flex items-center gap-2">
            <UIcon name="i-lucide-loader" class="animate-spin" />
            <span>Loading your info...</span>
          </div>
          
          <div v-else-if="user" class="space-y-2">
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p><strong>Role:</strong> {{ user.role?.name || 'No role' }}</p>
            <p><strong>Login time:</strong> {{ formatTime(user.createdAt) }}</p>
          </div>

          <UButton 
            @click="refreshUser" 
            :loading="loading"
            color="blue"
            variant="soft"
            icon="i-lucide-refresh-cw"
            block
          >
            Refresh Data
          </UButton>
        </div>
      </UCard>

      <!-- Interactive Demos -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-zap" class="text-yellow-500" />
            <h3 class="font-semibold">Interactive Demo</h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Toast Demos -->
          <div class="space-y-2">
            <p class="text-sm text-gray-600">Try different toast notifications:</p>
            <div class="flex flex-wrap gap-2">
              <UButton @click="showSuccessToast" color="green" size="sm">
                ✅ Success
              </UButton>
              <UButton @click="showWarningToast" color="yellow" size="sm">
                ⚠️ Warning
              </UButton>
              <UButton @click="showErrorToast" color="red" size="sm">
                ❌ Error
              </UButton>
              <UButton @click="showInfoToast" color="blue" size="sm">
                ℹ️ Info
              </UButton>
            </div>
          </div>

          <!-- Counter Demo -->
          <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-gray-700">Counter Demo:</span>
              <div class="flex items-center gap-2">
                <UButton @click="counter--" size="sm" variant="outline">-</UButton>
                <span class="text-xl font-bold text-purple-600 px-3">{{ counter }}</span>
                <UButton @click="counter++" size="sm" variant="outline">+</UButton>
              </div>
            </div>
          </div>

          <!-- Fun Messages -->
          <UButton 
            @click="showRandomMessage" 
            color="purple" 
            variant="soft"
            icon="i-lucide-sparkles"
            block
          >
            Show Random Message
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Achievement Banner -->
    <div class="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-6 text-white text-center">
      <h2 class="text-xl font-bold mb-2">🏆 Congratulations!</h2>
      <p>You just built a working extension with ZERO server-side changes!</p>
      <p class="text-sm opacity-90 mt-2">
        This extension features API calls, real-time data, interactive UI, and toast notifications.
      </p>
    </div>

    <!-- Current Message Display -->
    <div v-if="currentMessage" class="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 rounded-lg">
      <p class="text-gray-800 font-medium">{{ currentMessage }}</p>
    </div>
  </div>
</template>

<script setup>
// State management
const user = ref(null)
const loading = ref(false)
const counter = ref(0)
const currentMessage = ref('')

// Enfyra composables (auto-available)
const toast = useToast()

// API integration
const { data: userData, execute: fetchUser } = useApiLazy(() => '/me', {
  query: { fields: '*,role.*' },
  errorContext: 'Fetch Current User'
})

// Watch for user data
watch(userData, (newData) => {
  if (newData?.data?.[0]) {
    user.value = newData.data[0]
  }
}, { immediate: true })

// Load user data on mount
onMounted(async () => {
  await refreshUser()
})

// Functions
async function refreshUser() {
  loading.value = true
  await fetchUser()
  loading.value = false
  
  toast.add({
    title: 'Data Refreshed!',
    description: 'User information updated successfully',
    color: 'green'
  })
}

function showSuccessToast() {
  toast.add({
    title: '🎉 Success!',
    description: 'This is a success notification',
    color: 'green'
  })
  currentMessage.value = '✅ Success toast displayed!'
}

function showWarningToast() {
  toast.add({
    title: '⚠️ Warning!',
    description: 'This is a warning notification',
    color: 'yellow'
  })
  currentMessage.value = '⚠️ Warning toast displayed!'
}

function showErrorToast() {
  toast.add({
    title: '❌ Error!',
    description: 'This is an error notification',
    color: 'red'
  })
  currentMessage.value = '❌ Error toast displayed!'
}

function showInfoToast() {
  toast.add({
    title: 'ℹ️ Information',
    description: 'This is an info notification',
    color: 'blue'
  })
  currentMessage.value = 'ℹ️ Info toast displayed!'
}

function showRandomMessage() {
  const messages = [
    '🚀 You are building the future!',
    '💡 Extensions make everything possible!',
    '⚡ Real-time development is amazing!',
    '🎨 No-code development at its finest!',
    '🌟 Your creativity is the only limit!',
    '🏗️ Building without boundaries!',
    '🎯 Hit your development goals faster!'
  ]
  
  const randomMsg = messages[Math.floor(Math.random() * messages.length)]
  currentMessage.value = randomMsg
  
  toast.add({
    title: 'Random Inspiration!',
    description: randomMsg,
    color: 'purple'
  })
}

function formatTime(dateString) {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}
</script>
```

4. **Link to your menu:**
   - Click the pen icon next to "menu" field
   - Select your "My Demo" menu item
   - **Save**

### Step 4: Test Your Extension

1. **Navigate to Dashboard**
2. **Click "My Demo"** in the sidebar
3. **Interact with your extension:**
   - Click the toast buttons
   - Use the counter
   - Try the random message generator
   - Refresh user data

✅ **Success!** You built a fully interactive extension!

---

## 🎯 What You Just Accomplished

**In just 15 minutes, you created:**

- ✅ **Interactive UI** with modern design
- ✅ **Real-time API calls** to `/me` endpoint
- ✅ **Toast notifications** with different styles
- ✅ **Reactive state management** with Vue 3
- ✅ **Professional navigation** integration
- ✅ **Live deployment** without server restarts

**🔧 Technical Features Used:**
- Vue 3 Composition API
- Enfyra UI components (UCard, UButton, UIcon)
- useApiLazy for data fetching
- useToast for notifications
- Real-time state updates
- Responsive design

**🚀 The Power:** You built this entire feature **without touching any server code** - just the web interface!

---

## 🎓 Next Steps

### Ready for More?

**Now you can build:**
- 📋 **Task managers** with full CRUD
- 📊 **Dashboards** with charts and stats  
- 🔍 **Data viewers** with filters and search
- 🛍️ **E-commerce** features
- 📱 **Mobile-friendly** widgets
- 🔐 **Admin panels** with permissions

### Advanced Learning

- **[Extension Development Guide](./extension-development-guide.md)** - Deep dive into patterns
- **[API Composables](./api-composables.md)** - Master data fetching
- **[Permission System](./permission-system.md)** - Secure your features
- **[Filter System](./filter-query.md)** - Build advanced queries

### Pro Tips

💡 **Extensions can:**
- Call any API endpoint
- Use all Vue 3 features
- Access user permissions
- Embed other extensions as widgets
- Create complex forms automatically
- Build real-time interfaces

🎨 **UI Components available:**
- All @nuxt/ui components
- Custom Enfyra components
- Icons from Lucide
- Professional layouts
- Responsive grids

---

## 🎉 Welcome to No-Code Development!

You're now ready to build **production-ready applications** using only the Enfyra web interface. 

**The only limit is your imagination!** 🚀✨