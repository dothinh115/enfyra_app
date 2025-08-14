# SettingsCard Component

Reusable card component for settings pages with consistent styling and flexible configuration.

## Features

- ✅ **Consistent Design**: Unified look across all settings pages
- ✅ **Tablet Optimized**: Responsive hover effects and proper sizing
- ✅ **Flexible Props**: Customizable icon, colors, stats, and actions
- ✅ **Slot Support**: Custom header actions, body content, and footer
- ✅ **TypeScript**: Full type safety with intelligent auto-completion

## Basic Usage

```vue
<CommonSettingsCard
  title="Role Name"
  description="Role description"
  icon="lucide:shield-check"
  icon-color="primary"
  :stats="[
    { label: 'Created', value: '2024-01-15' }
  ]"
  :actions="[
    {
      label: 'View Details',
      props: { icon: 'lucide:eye', variant: 'outline', size: 'sm' },
      to: '/settings/roles/123',
      block: true
    }
  ]"
/>
```

## Advanced Usage with Slots

```vue
<CommonSettingsCard
  title="User Name"
  description="user@example.com"
  icon="lucide:user"
  icon-color="success"
>
  <!-- Custom header actions -->
  <template #headerActions>
    <UAvatar :alt="user.name" size="xs">
      {{ user.email?.charAt(0)?.toUpperCase() }}
    </UAvatar>
  </template>
  
  <!-- Custom body content -->
  <div class="custom-content">
    <!-- Your custom content here -->
  </div>
  
  <!-- Custom footer -->
  <template #footer>
    <div class="flex gap-2">
      <UButton size="sm" variant="outline">Custom Action</UButton>
    </div>
  </template>
</CommonSettingsCard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card title (required) |
| `description` | `string` | - | Card subtitle/description |
| `icon` | `string` | - | Icon name (lucide format) |
| `iconColor` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | Icon color theme |
| `stats` | `Stat[]` | `[]` | Array of statistics to display |
| `actions` | `Action[]` | `[]` | Array of action buttons |
| `cardClass` | `string` | `''` | Additional CSS classes for card |

## Stat Interface

```typescript
interface Stat {
  label: string;
  value?: string | number;
  component?: any;        // For custom components like UBadge
  props?: Record<string, any>; // Props for the component
}
```

## Action Interface

```typescript
interface Action {
  label: string;
  props?: Record<string, any>; // UButton props
  to?: string;            // Navigation route
  onClick?: () => void;   // Click handler
  loading?: boolean;      // Loading state
  disabled?: boolean;     // Disabled state
  block?: boolean;        // Full width button
}
```

## Examples

### Role Card
```vue
<CommonSettingsCard
  title="Admin Role"
  description="Full system access"
  icon="lucide:shield-check"
  icon-color="primary"
  :stats="[
    { label: 'Created', value: '2024-01-15' },
    { label: 'Users', value: '5' }
  ]"
  :actions="[
    { label: 'Edit', props: { variant: 'outline', size: 'sm' }, to: '/edit' },
    { label: 'Delete', props: { variant: 'outline', color: 'error', size: 'sm' }, onClick: deleteRole }
  ]"
/>
```

### Extension Card
```vue
<CommonSettingsCard
  title="Custom Extension"
  description="API integration module"
  icon="lucide:puzzle"
  icon-color="warning"
  :stats="[
    { 
      label: 'Status', 
      component: 'UBadge',
      props: { color: 'success', variant: 'soft' },
      value: 'Active'
    }
  ]"
  :actions="[
    { label: 'Configure', props: { variant: 'solid', size: 'sm' }, to: '/configure', block: true }
  ]"
/>
```

## Grid Layout Integration

Use with responsive grid for tablet optimization:

```vue
<div 
  class="grid gap-4"
  :class="isTablet ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'"
>
  <CommonSettingsCard v-for="item in items" :key="item.id" v-bind="item" />
</div>
```