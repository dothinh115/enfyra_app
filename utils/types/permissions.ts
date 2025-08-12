export type PermissionRule = {
  route: string;
  actions: string[];
};

export type PermissionCondition = {
  and?: (PermissionRule | PermissionCondition)[];
  or?: (PermissionRule | PermissionCondition)[];
  allowAll?: boolean;
};