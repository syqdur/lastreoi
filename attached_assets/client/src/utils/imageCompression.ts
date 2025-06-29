/**
 * Image compression utility for reducing file sizes before Firebase upload
 * Compresses images to prevent Firebase field size limit errors
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number;
  maxAttempts?: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    targetSizeKB = 500, // Target 500KB for Firebase compatibility
    maxAttempts = 5
  } = options;

  console.log(`🗜️ Starting image compression for: ${file.name}`);
  console.log(`📊 Original size: ${(file.size / 1024).toFixed(1)}KB`);

  // If file is already small enough, return as-is
  if (file.size <= targetSizeKB * 1024) {
    console.log(`✅ File already optimal size, no compression needed`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let attempts = 0;

        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Komprimierung fehlgeschlagen'));
              return;
            }

            const compressedSize = blob.size;
            const compressionRatio = ((file.size - compressedSize) / file.size * 100).toFixed(1);
            
            console.log(`🗜️ Attempt ${attempts + 1}: ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

            // If target size reached or max attempts exhausted, return result
            if (compressedSize <= targetSizeKB * 1024 || attempts >= maxAttempts) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              console.log(`✅ Compression complete: ${(compressedFile.size / 1024).toFixed(1)}KB`);
              resolve(compressedFile);
              return;
            }

            // Reduce quality for next attempt
            attempts++;
            currentQuality *= 0.7;
            tryCompress();
          }, file.type, currentQuality);
        };

        tryCompress();
      } catch (error) {
        console.error('❌ Compression error:', error);
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Bild konnte nicht geladen werden'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const compressVideo = async (
  file: File,
  targetSizeKB: number = 2048 // 2MB target for videos
): Promise<File> => {
  console.log(`🎬 Video compression for: ${file.name}`);
  console.log(`📊 Original size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);

  // For videos, we'll just check size and warn if too large
  // Real video compression would require WebAssembly/FFmpeg
  if (file.size <= targetSizeKB * 1024) {
    console.log(`✅ Video size acceptable`);
    return file;
  }

  // For now, return original file but log warning
  console.warn(`⚠️ Video size (${(file.size / 1024 / 1024).toFixed(1)}MB) may cause upload issues`);
  return file;
};

export const shouldCompress = (file: File): boolean => {
  const maxSizeKB = 1000; // 1MB threshold
  return file.size > maxSizeKB * 1024;
};