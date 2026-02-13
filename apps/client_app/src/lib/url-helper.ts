/**
 * Helper function to build full URLs for assets
 */
export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // If path already contains the protocol, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Extract filename from /uploads/filename.jpg path
  let filename = path;
  if (path.includes('/uploads/')) {
    filename = path.split('/uploads/')[1];
  } else if (path.startsWith('/')) {
    filename = path.substring(1);
  }

  // Use /assets/ endpoint that serves files from the uploads directory
  return `${apiUrl}/assets/${filename}`;
};

/**
 * Helper function specifically for avatar URLs with cache busting
 * This ensures that when a user updates their avatar, the new image is loaded
 */
export const getAvatarUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  const baseUrl = getAssetUrl(path);
  if (!baseUrl) return null;

  // Add cache busting parameter
  const cacheBust = Math.floor(Date.now() / 60000); // Refresh every minute
  return `${baseUrl}?t=${cacheBust}`;
};
