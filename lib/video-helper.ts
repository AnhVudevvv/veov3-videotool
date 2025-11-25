// lib/video-helper.ts

/**
 * Extract last frame from video blob as Base64 JPEG
 * Enhanced error handling and multiple retry strategies
 */
export const extractLastFrameAsBase64 = (videoBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`[extractFrame] Starting extraction from ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB blob`);
    
    const video = document.createElement('video');
    video.preload = 'auto'; // Changed from 'metadata' to 'auto'
    video.playsInline = true;
    video.muted = true;
    video.crossOrigin = 'anonymous';
    
    const blobUrl = URL.createObjectURL(videoBlob);
    video.src = blobUrl;

    let settled = false;
    let metadataLoaded = false;

    const cleanup = () => {
      video.pause();
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplaythrough = null;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      video.src = '';
      video.load();
    };

    // Extended timeout to 45 seconds
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        console.error('[extractFrame] Timeout after 45s');
        reject(new Error('Frame extraction timeout after 45 seconds'));
      }
    }, 45000);

    video.onerror = (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        console.error('[extractFrame] Video error:', e);
        reject(new Error('Video loading error: ' + (video.error?.message || 'Unknown')));
      }
    };

    video.onloadedmetadata = () => {
      if (settled) return;
      
      metadataLoaded = true;
      console.log(`[extractFrame] Metadata loaded: ${video.duration?.toFixed(2)}s, ${video.videoWidth}x${video.videoHeight}`);
      
      if (!video.duration || !isFinite(video.duration) || video.duration === 0) {
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Invalid video duration'));
        return;
      }

      if (!video.videoWidth || !video.videoHeight) {
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Invalid video dimensions'));
        return;
      }
      
      // Seek to 0.2s before end (safer than 0.1s to avoid black frames)
      const seekTime = Math.max(0, video.duration - 0.2);
      console.log(`[extractFrame] Seeking to ${seekTime.toFixed(2)}s`);
      
      try {
        video.currentTime = seekTime;
      } catch (e) {
        console.error('[extractFrame] Seek failed:', e);
        settled = true;
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Failed to seek video'));
      }
    };

    video.onseeked = () => {
      if (settled) return;
      
      console.log(`[extractFrame] Seeked to ${video.currentTime.toFixed(2)}s`);
      
      // Small delay to ensure frame is rendered
      setTimeout(() => {
        if (settled) return;
        
        try {
          // Double check dimensions
          if (!video.videoWidth || !video.videoHeight) {
            throw new Error('Invalid video dimensions after seek');
          }

          const canvas = document.createElement('canvas');
          
          // Calculate resize dimensions (max 1280x720)
          let width = video.videoWidth;
          let height = video.videoHeight;
          
          const maxWidth = 1280;
          const maxHeight = 720;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Ensure even dimensions (required for some video codecs)
          width = Math.floor(width / 2) * 2;
          height = Math.floor(height / 2) * 2;
          
          canvas.width = width;
          canvas.height = height;
          
          console.log(`[extractFrame] Canvas size: ${width}x${height}`);
          
          const ctx = canvas.getContext('2d', { 
            alpha: false,
            willReadFrequently: false 
          });
          
          if (!ctx) {
            throw new Error('Cannot get canvas 2D context');
          }

          // Fill with white background first (prevents transparent frames)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Draw video frame
          ctx.drawImage(video, 0, 0, width, height);
          
          // Convert to JPEG with quality 0.85 (good balance)
          let dataUrl: string;
          try {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          } catch (e) {
            console.warn('[extractFrame] JPEG failed, trying PNG...');
            dataUrl = canvas.toDataURL('image/png');
          }
          
          const base64 = dataUrl.split(',')[1];
          
          if (!base64 || base64.length < 100) {
            throw new Error('Invalid base64 output (too short)');
          }
          
          // Verify it's not a blank frame
          const imageData = ctx.getImageData(0, 0, Math.min(50, width), Math.min(50, height));
          const pixels = imageData.data;
          let totalBrightness = 0;
          
          for (let i = 0; i < pixels.length; i += 4) {
            totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          }
          
          const avgBrightness = totalBrightness / (pixels.length / 4);
          console.log(`[extractFrame] Average brightness: ${avgBrightness.toFixed(2)}`);
          
          if (avgBrightness < 5 || avgBrightness > 250) {
            console.warn('[extractFrame] Warning: Frame might be blank (brightness: ' + avgBrightness + ')');
          }
          
          const sizeMB = (base64.length * 0.75 / 1024 / 1024).toFixed(2);
          const sizeBytes = base64.length * 0.75;
          const maxBytes = 5 * 1024 * 1024;
          
          console.log(`[extractFrame] ✓ Success: ${width}x${height}, ${sizeMB}MB`);
          
          if (sizeBytes > maxBytes) {
            console.warn(`[extractFrame] Warning: Frame size ${sizeMB}MB exceeds 5MB limit`);
          }
          
          settled = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(base64);
          
        } catch (e) {
          settled = true;
          clearTimeout(timeoutId);
          cleanup();
          console.error('[extractFrame] Canvas error:', e);
          reject(e);
        }
      }, 200); // 200ms delay for frame rendering
    };

    // Fallback: if metadata doesn't load in 10s, try loading data
    setTimeout(() => {
      if (!settled && !metadataLoaded) {
        console.log('[extractFrame] Metadata timeout, forcing load...');
        video.load();
      }
    }, 10000);
  });
};

/**
 * Validate Base64 image data
 */
export const validateBase64Image = (base64: string): boolean => {
  try {
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    
    if (cleanBase64.length < 100) {
      console.error('[validateBase64] Too short:', cleanBase64.length);
      return false;
    }
    
    const sizeBytes = cleanBase64.length * 0.75;
    const maxBytes = 5 * 1024 * 1024;
    
    if (sizeBytes > maxBytes) {
      console.error('[validateBase64] Too large:', (sizeBytes / 1024 / 1024).toFixed(2) + 'MB');
      return false;
    }
    
    // Test base64 validity
    try {
      atob(cleanBase64.substring(0, 100));
    } catch {
      console.error('[validateBase64] Invalid base64 encoding');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[validateBase64] Validation error:', e);
    return false;
  }
};

/**
 * Enhanced extraction with retry logic
 */
export const extractLastFrameWithRetry = async (
  videoBlob: Blob, 
  maxRetries: number = 2
): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[extractFrame] Attempt ${attempt}/${maxRetries}`);
      const base64 = await extractLastFrameAsBase64(videoBlob);
      
      if (validateBase64Image(base64)) {
        console.log(`[extractFrame] ✓ Success on attempt ${attempt}`);
        return base64;
      } else {
        throw new Error('Extracted frame failed validation');
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`[extractFrame] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`[extractFrame] Waiting 2s before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  throw lastError || new Error('All extraction attempts failed');
};