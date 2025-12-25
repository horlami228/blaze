/**
 * Common file size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  SMALL: 1 * 1024 * 1024, // 1MB
  MEDIUM: 5 * 1024 * 1024, // 5MB
  LARGE: 10 * 1024 * 1024, // 10MB
  EXTRA_LARGE: 50 * 1024 * 1024, // 50MB
  MAX: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Helper function to format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
