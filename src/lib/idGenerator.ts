/**
 * Utility functions for generating unique IDs using the Web Crypto API
 */

/**
 * Generates a UUID v4 using the Web Crypto API
 * Falls back to a pseudo-random implementation if crypto.randomUUID is not available
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generates a UUID v4 without dashes
 * Useful for generating compact unique identifiers
 */
export const generateCompactId = (): string => {
  return generateId().replace(/-/g, '');
};

/**
 * Generates a prefixed unique identifier
 * @param prefix The prefix to add to the ID
 * @param separator The separator between prefix and ID (default: '_')
 */
export const generatePrefixedId = (prefix: string, separator: string = '_'): string => {
  return `${prefix}${separator}${generateCompactId()}`;
}; 