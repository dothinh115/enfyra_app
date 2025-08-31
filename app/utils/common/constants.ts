export const ACCESS_TOKEN_KEY = "accessToken";
export const EXP_TIME_KEY = "exp_time";
export const REFRESH_TOKEN_KEY = "refreshToken";

export const isSystemTableModifiable = (tableName: string): boolean => {
  const modifiableSystemTables = ["user_definition"];
  return modifiableSystemTables.includes(tableName);
};
