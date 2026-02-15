
export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let filename = path;
  if (path.includes('/uploads/')) {
    filename = path.split('/uploads/')[1];
  } else if (path.startsWith('/')) {
    filename = path.substring(1);
  }

  return `${apiUrl}/assets/${filename}`;
};


export const getAvatarUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  const baseUrl = getAssetUrl(path);
  if (!baseUrl) return null;

  const cacheBust = Math.floor(Date.now() / 60000); 
  return `${baseUrl}?t=${cacheBust}`;
};
