export const ACCESS_TOKEN_KEY = "access_token";
export const EXP_TIME_KEY = "exp_time";
export const REFRESH_TOKEN_KEY = "refresh_token";

export const isSystemTableModifiable = (tableName: string): boolean => {
  const modifiableSystemTables = ["user_definition"];
  return modifiableSystemTables.includes(tableName);
};