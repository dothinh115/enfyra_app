import type { ComputedRef, Ref } from "vue";
import type { PermissionCondition } from "./permissions";

// Data Table Types
export interface DataTableProps {
  data: any[];
  columns: any[]; // Using any for @tanstack/vue-table ColumnDef compatibility
  pageSize?: number;
  loading?: boolean;
  selectable?: boolean;
}

// Tablet Card Component (renamed from MobileCard)
export interface TabletCardProps {
  row: any;
  cells: any[];
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: () => void;
}

// Legacy alias for backward compatibility
export interface MobileCardProps extends TabletCardProps {}

// Column Selector Component
export interface ColumnSelectorProps {
  items: Array<{
    label: string;
    type: "checkbox";
    checked: boolean;
    onSelect: (e: Event) => void;
  }>;
}

// Bulk Actions Component
export interface BulkActionsProps {
  selectedCount: number;
  onDelete?: () => void;
}

// Upload Modal Component
export interface UploadModalProps {
  modelValue: boolean;
  title?: string;
  accept?: string | string[];
  multiple?: boolean;
  maxSize?: number; // in bytes
  dragText?: string;
  acceptText?: string;
  uploadText?: string;
  uploadingText?: string;
  loading?: boolean; // External loading state
}

export interface UploadModalEmits {
  "update:modelValue": [value: boolean];
  upload: [files: File | File[]];
  error: [message: string];
}

// Loading Component
export interface LoadingProps {
  show?: boolean;
  message?: string;
}

// Global Loading Component
export interface GlobalLoadingProps {
  show: boolean;
  title?: string;
  description?: string;
}

// Route Loading Component
export interface RouteLoadingProps {
  show?: boolean;
  message?: string;
}

// Permission Gate Component
export interface PermissionGateProps {
  // Legacy props for backward compatibility
  actions?: string[];
  routes?: string[];
  mode?: "any" | "all";
  // New flexible permission condition
  condition?: PermissionCondition;
}

// Header Action Types
export interface HeaderAction {
  id: string;
  label?: string;
  icon?: string;
  variant?: "solid" | "outline" | "ghost" | "soft";
  color?:
    | "primary"
    | "secondary"
    | "warning"
    | "success"
    | "info"
    | "error"
    | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  loading?:
    | boolean
    | Ref<boolean>
    | Readonly<Ref<boolean>>
    | ComputedRef<boolean>;
  disabled?:
    | boolean
    | Ref<boolean>
    | Readonly<Ref<boolean>>
    | ComputedRef<boolean>;
  permission?: PermissionCondition;
  onClick?: () => void;
  to?: string;
  submit?: () => void;
  showOn?: string[];
  hideOn?: string[];
  class?: string;
  // For custom components
  component?: string | any; // Can be string name or resolved component
  props?: Record<string, any>;
  key?: string; // For forcing component re-render
  side?: "left" | "right"; // Position in sub-header, default: "right"
  global?: boolean; // If true, persist across route changes
}

// Settings Card Component
export interface SettingsCardStat {
  label: string;
  value?: string | number;
  component?: any;
  props?: Record<string, any>;
}

export interface SettingsCardAction {
  label: string;
  props?: Record<string, any>;
  to?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
}

export interface SettingsCardHeaderAction {
  component?: string; // Component name like 'UButton', 'USwitch', 'UAvatar'
  props?: Record<string, any>; // Props to pass to the component
  label?: string; // Text label for buttons
  onClick?: (e?: Event) => void; // Click handler
  onUpdate?: (value: any) => void; // For v-model components like USwitch
}

export interface SettingsCardProps {
  title: string;
  description?: string;
  icon: string;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  stats?: SettingsCardStat[];
  actions?: SettingsCardAction[];
  headerActions?: SettingsCardHeaderAction[];
  cardClass?: string;
}