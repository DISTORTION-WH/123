/**
 * Generate a thumbnail from a video URL using canvas
 * Extracts a frame from the video at the specified time
 * Maintains aspect ratio by center-cropping the video frame
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
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          if (videoWidth <= 0 || videoHeight <= 0) {
            resolve(null);
            return;
          }

          // Calculate aspect-ratio aware crop
          // Determine which dimension should be the limiting factor
          const videoAspect = videoWidth / videoHeight;
          const canvasAspect = width / height;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = videoWidth;
          let sourceHeight = videoHeight;

          if (videoAspect > canvasAspect) {
            // Video is wider: crop from left and right
            sourceWidth = Math.round(videoHeight * canvasAspect);
            sourceX = Math.round((videoWidth - sourceWidth) / 2);
          } else {
            // Video is taller: crop from top and bottom
            sourceHeight = Math.round(videoWidth / canvasAspect);
            sourceY = Math.round((videoHeight - sourceHeight) / 2);
          }

          ctx.drawImage(
            video,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            width,
            height
          );
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          console.error('Error drawing video frame:', error);
          resolve(null);
        }
      },
      { once: true }
    );

    video.addEventListener('error', (e) => {
      console.error('Error loading video for thumbnail:', {
        url: videoUrl,
        videoError: video.error,
        errorCode: (e as any)?.target?.error?.code,
      });
      resolve(null);
    });

    video.addEventListener('loadstart', () => {
      console.log('Video loading started:', videoUrl);
    });

    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.load();

    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Video thumbnail generation timeout:', videoUrl);
      resolve(null);
    }, 10000);

    // Clean up timeout if video loads successfully
    video.addEventListener('seeked', () => {
      clearTimeout(timeoutId);
    }, { once: true });
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
