export type PermissionRule = {
  route: string;
  actions: string[];
  allowedUsers?: string[]; // Array of user UUIDs for direct access
};

export type PermissionCondition = {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
  allowAll?: boolean;
};
