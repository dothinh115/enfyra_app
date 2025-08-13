# Enfyra CMS - Project Structure Documentation

## Overview
Enfyra CMS là một hệ thống quản lý nội dung được xây dựng trên Nuxt 3 với Vue 3 Composition API và TypeScript. Dự án sử dụng Nuxt UI và Tailwind CSS cho giao diện người dùng.

## Root Level Files
- `nuxt.config.ts` - Cấu hình Nuxt 3 
- `app.vue` - Root component của application
- `app.config.ts` - App configuration
- `package.json` - Dependencies và scripts
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## Directory Structure

### `/assets/` - Static Assets
```
assets/
├── css/
│   ├── main.css          # Global CSS styles
│   └── transitions.css   # CSS transitions cho animations
```

### `/components/` - Vue Components
Tổ chức theo chức năng và tầng (layers):

```
components/
├── common/                    # Shared components
│   ├── DynamicComponent.vue   # Dynamic extension loading
│   ├── SettingsCard.vue      # Card component cho settings pages
│   ├── EmptyState.vue        # Empty state display
│   ├── LoadingState.vue      # Loading states
│   ├── MobileWarning.vue     # Mobile device warning
│   └── loading/              # Loading animations
│
├── data-table/               # Table components
│   ├── DataTable.vue         # Main data table
│   ├── TabletCard.vue        # Tablet view cards
│   ├── BulkActions.vue       # Bulk operations
│   └── ColumnSelector.vue    # Column visibility controls
│
├── filter/                   # Filter system
│   ├── Builder.vue           # Filter query builder
│   ├── Drawer.vue           # Filter sidebar drawer
│   ├── Condition.vue        # Individual filter conditions
│   └── Group.vue            # Filter groups
│
├── form/                     # Form components
│   ├── FieldRenderer.vue     # Dynamic field rendering
│   ├── Editor.vue           # Rich text editor wrapper
│   ├── CodeEditor.vue       # Code editor component
│   ├── permission/          # Permission-specific forms
│   │   ├── InlineEditor.vue  # Inline permission editor
│   │   ├── Selector.vue     # Permission selector
│   │   └── ...
│   └── relation/            # Relational field components
│       ├── Selector.vue     # Relation picker
│       ├── InlineEditor.vue # Inline relation editor
│       └── ...
│
├── layout/                   # Layout components
│   ├── Header.vue           # Main header
│   └── HeaderActions.vue    # Header action buttons
│
└── sidebar/                  # Sidebar navigation
    ├── Menu.vue             # Full sidebar menu
    └── MiniMenu.vue         # Collapsed sidebar
```

### `/composables/` - Vue Composables
Business logic và state management:

```
composables/
├── useApi.ts                    # API calls và error handling
├── useAuth.ts                   # Authentication state
├── useMenuRegistry.ts           # Dynamic menu system
├── useHeaderActionRegistry.ts   # Header actions management
├── usePermissions.ts           # Permission checking
├── useSchema.ts                # Schema operations
├── useFilterQuery.ts           # Filter query building
├── useScreen.ts                # Screen size detection
├── useLoader.ts                # Loading states
├── useConfirm.ts               # Confirmation dialogs
├── useMounted.ts               # Mount state tracking
└── useGlobalState.ts           # Global app state
```

### `/pages/` - Route Pages
File-based routing theo Nuxt conventions:

```
pages/
├── index.vue                    # Home/Dashboard redirect
├── login.vue                   # Login page
├── dashboard.vue               # Main dashboard
├── [sidebar].vue               # Dynamic single-param routing
├── [sidebar]/
│   └── [page].vue              # Dynamic two-param routing
│
├── collections/                # Collection management
│   ├── index.vue              # Collections listing
│   ├── create.vue             # Create new collection
│   └── [table].vue            # Individual collection page
│
├── data/                       # Data management
│   ├── index.vue              # Data overview
│   └── [table]/               # Table-specific data
│       ├── index.vue          # Data listing
│       ├── create.vue         # Create new record
│       └── [id].vue           # Edit record
│
└── settings/                   # Settings pages
    ├── index.vue              # Settings overview
    ├── users/                 # User management
    ├── roles/                 # Role management
    ├── menus/                 # Menu management
    ├── extensions/            # Extension management
    ├── handlers/              # Handler management
    ├── hooks/                 # Hook management
    ├── routings/              # Route management
    └── general/               # General settings
```

### `/layouts/` - Layout Templates
```
layouts/
└── default.vue                # Main application layout
```

### `/middleware/` - Route Middleware
```
middleware/
├── auth.global.ts             # Global authentication check
└── dashboard-redirect.global.ts # Dashboard redirect logic
```

### `/plugins/` - Nuxt Plugins
```
plugins/
├── api-refresh.client.ts      # API token refresh
├── loading.client.ts          # Global loading state
├── menu-registry.client.ts    # Menu registry initialization
└── router.client.ts           # Router customizations
```

### `/server/` - Server-side Code
```
server/
├── api/                       # API endpoints
│   ├── [...path].ts          # Catch-all API proxy
│   ├── login.post.ts         # Login endpoint
│   ├── logout.post.ts        # Logout endpoint
│   ├── me.get.ts             # Current user endpoint
│   └── extension_definition/  # Extension API endpoints
│
└── middleware/                # Server middleware
    ├── [...path].ts          # API middleware
    └── server-id.ts          # Server identification
```

### `/utils/` - Utility Functions
```
utils/
├── types/                     # TypeScript type definitions
│   ├── api.ts                # API response types
│   ├── extensions.ts         # Extension types
│   ├── permissions.ts        # Permission types
│   ├── menu.ts               # Menu types
│   └── ui.ts                 # UI component types
│
├── common/                    # Common utilities
│   ├── constants.ts          # App constants
│   ├── filter/               # Filter utilities
│   └── regex.ts              # Regex patterns
│
├── components/                # Component utilities
│   └── form.ts               # Form helpers
│
└── server/                    # Server utilities
    ├── auth/                 # Authentication helpers
    ├── extension.ts          # Extension loading
    └── proxy.ts              # API proxy utilities
```

### `/docs/` - Documentation
```
docs/
├── project-structure.md         # This file
├── permission-system.md         # Permission system guide
├── menu-registry-system.md      # Menu system documentation
├── header-action-registry.md    # Header actions guide
├── FilterQuery.md               # Filter system guide
├── FormField.md                 # Form field documentation
├── api-composables.md           # API composables guide
└── plugin-development-guide-vi.md # Plugin development (Vietnamese)
```

## Key Architecture Patterns

### 1. Dynamic Component Loading
- `DynamicComponent.vue` - Loads components based on path
- Extension system cho plugins
- File-based routing với `[sidebar].vue` và `[sidebar]/[page].vue`

### 2. Registry Systems
- **Menu Registry**: Dynamic menu generation từ tables
- **Header Action Registry**: Dynamic header buttons
- **Permission System**: Role-based access control

### 3. Component Patterns
- **SettingsCard**: Standardized card component với props-based actions
- **DataTable**: Responsive table với tablet cards
- **Filter System**: Advanced querying capabilities

### 4. State Management
- Vue 3 Composition API
- Composables cho business logic
- Global state với `useGlobalState`

### 5. Form System
- Dynamic field rendering
- Permission integration
- Relation field support
- Rich text editing

### 6. API Integration
- Proxy-based API calls
- Error handling
- Loading states
- Token refresh

## Development Guidelines

### Component Organization
- `/common/` - Reusable UI components
- `/data-table/` - Table-specific components  
- `/form/` - Form-related components
- `/filter/` - Filter system components

### Composable Patterns
- Prefix với `use`
- Return reactive state và methods
- Handle loading/error states
- Provide TypeScript types

### Page Structure
- Index pages cho listings
- Create pages cho new records
- `[id]` pages cho editing
- Consistent pagination patterns

### Styling Approach
- Tailwind CSS utility-first
- Dark mode support
- Responsive design
- Consistent spacing/colors

## Extension System
Extensions được load dynamic qua:
- `/enfyra-extension/` directory
- Database-driven configuration
- Dynamic component resolution
- Hot-reloadable development

## Mobile Support
- Responsive breakpoints
- Tablet-specific layouts
- Mobile warning component
- Touch-friendly interactions

---
*Last updated: Conversation summary từ 2025-01-13*