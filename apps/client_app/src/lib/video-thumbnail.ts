/**
 * Generate a thumbnail from a video URL using canvas
 * Extracts a frame from the video at the specified time
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  timeInSeconds: number = 1,
  width: number = 320,
  height: number = 320,
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(null);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    video.addEventListener(
      'loadedmetadata',
      () => {
        video.currentTime = Math.min(timeInSeconds, video.duration);
      },
      { once: true }
    );

    video.addEventListener(
      'seeked',
      () => {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          console.error('Error drawing video frame:', error);
          resolve(null);
        }
      },
      { once: true }
    );

    video.addEventListener('error', () => {
      console.error('Error loading video for thumbnail');
      resolve(null);
    });

    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.load();

    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(null);
    }, 5000);
  });
}

/**
 * Cache for generated thumbnails to avoid regenerating
 */
const thumbnailCache = new Map<string, string>();

export async function getVideoThumbnail(
  videoUrl: string,
  timeInSeconds: number = 1,
): Promise<string | null> {
  const cacheKey = `${videoUrl}:${timeInSeconds}`;

  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey) || null;
  }

  const thumbnail = await generateVideoThumbnail(videoUrl, timeInSeconds);
  if (thumbnail) {
    thumbnailCache.set(cacheKey, thumbnail);
  }
  return thumbnail;
}
