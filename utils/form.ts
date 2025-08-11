/**
 * Utility functions for form data handling
 */

/**
 * Ensures a value is always a string to prevent editor errors
 * @param value - The value to convert to string
 * @returns A string representation of the value
 */
export function ensureString(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  return String(value);
}

/**
 * Ensures a value is always an array
 * @param value - The value to convert to array
 * @returns An array representation of the value
 */
export function ensureArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

/**
 * Ensures a value is always a boolean
 * @param value - The value to convert to boolean
 * @returns A boolean representation of the value
 */
export function ensureBoolean(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  return Boolean(value);
}

/**
 * Ensures a value is always a number
 * @param value - The value to convert to number
 * @returns A number representation of the value
 */
export function ensureNumber(value: any): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Ensures a value is not null or undefined
 * @param value - The value to check
 * @returns The original value if not null/undefined, otherwise null
 */
export function ensureNotNull(value: any): any {
  return value !== null && value !== undefined ? value : null;
}
