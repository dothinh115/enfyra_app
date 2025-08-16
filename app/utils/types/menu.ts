import type { PermissionCondition } from "./permissions";

// API Response Interface from /menu_definition endpoint
export interface MenuDefinition {
  id: number;
  description: string;
  icon: string;
  isEnabled: boolean;
  isSystem: boolean;
  label: string;
  order: number;
  path: string;
  permission: PermissionCondition | null;
  type: "mini" | "menu";
  parent: number | null;
  sidebar: { id: number } | null;
  children: any[];
  menus: any[];
  createdAt: string;
  updatedAt: string;
}

// Internal Interface for Menu Items in useMenuRegistry
export interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  sidebarId: number;
  permission?: PermissionCondition;
}

// Internal Interface for Mini Sidebars in useMenuRegistry
export interface MiniSidebar {
  id: string;
  label: string;
  icon: string;
  route: string;
  permission?: PermissionCondition;
}

// API Response Interface from useMenuApi (different from MenuDefinition)
export interface MenuApiItem {
  id: number;
  description: string;
  icon: string;
  isEnabled: boolean;
  isSystem: boolean;
  label: string;
  order: number;
  path: string;
  permission: any;
  type: "mini" | "menu";
  parent: number | null;
  sidebar: { id: number } | null;
  children: any[];
  menus: any[];
  extension: any;
  createdAt: string;
  updatedAt: string;
}