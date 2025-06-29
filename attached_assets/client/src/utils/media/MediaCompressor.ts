import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  targetSize?: number; // in bytes
}

export interface VideoCompressionOptions {
  maxBitrate?: string;
  maxWidth?: number;
  maxHeight?: number;
  codec?: string;
  audioCodec?: string;
}

export class MediaCompressor {
  private static ffmpeg: FFmpeg | null = null;
  private static isLoading = false;

  private static async initFFmpeg(): Promise<FFmpeg> {
    if (this.ffmpeg) return this.ffmpeg;
    
    if (this.isLoading) {
      // Wait for existing initialization
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.ffmpeg!;
    }

    this.isLoading = true;
    
    try {
      this.ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      console.log('✅ FFmpeg loaded successfully');
      return this.ffmpeg;
    } catch (error) {
      console.error('❌ Failed to load FFmpeg:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  static async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1080,
      maxHeight = 1080,
      quality = 0.85,
      format = 'jpeg',
      targetSize
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate dimensions maintaining aspect ratio
          let { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx!.drawImage(img, 0, 0, width, height);
          
          // If target size is specified, use progressive compression
          if (targetSize) {
            this.compressToTargetSize(canvas, format, targetSize, quality)
              .then(resolve)
              .catch(reject);
          } else {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              `image/${format}`,
              quality
            );
          }
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  static async compressVideo(
    file: File,
    options: VideoCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const {
      maxBitrate = '2M',
      maxWidth = 1080,
      maxHeight = 1920,
      codec = 'libx264',
      audioCodec = 'aac'
    } = options;

    const ffmpeg = await this.initFFmpeg();
    
    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      
      // Write input file
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      // Progress monitoring
      ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }
      });

      // Compression command
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', codec,
        '-c:a', audioCodec,
        '-b:v', maxBitrate,
        '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
        '-preset', 'fast',
        '-crf', '23',
        outputName
      ]);

      // Read output
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });
      
      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
      
      return blob;
    } catch (error) {
      console.error('❌ Video compression failed:', error);
      throw error;
    }
  }

  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  private static async compressToTargetSize(
    canvas: HTMLCanvasElement,
    format: string,
    targetSize: number,
    initialQuality: number
  ): Promise<Blob> {
    let quality = initialQuality;
    let blob: Blob | null = null;
    
    // Progressive compression with binary search
    let minQuality = 0.1;
    let maxQuality = initialQuality;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, `image/${format}`, quality);
      });

      if (!blob) break;

      if (blob.size <= targetSize || Math.abs(maxQuality - minQuality) < 0.01) {
        break;
      }

      if (blob.size > targetSize) {
        maxQuality = quality;
      } else {
        minQuality = quality;
      }

      quality = (minQuality + maxQuality) / 2;
      attempts++;
    }

    if (!blob) {
      throw new Error('Failed to compress to target size');
    }

    return blob;
  }

  // Utility method for story-specific compression
  static async compressForStory(file: File): Promise<Blob> {
    if (file.type.startsWith('image/')) {
      return this.compressImage(file, {
        maxWidth: 1080,
        maxHeight: 1920,
        quality: 0.85,
        format: 'jpeg',
        targetSize: 512 * 1024 // 512KB
      });
    } else if (file.type.startsWith('video/')) {
      return this.compressVideo(file, {
        maxBitrate: '2M',
        maxWidth: 1080,
        maxHeight: 1920
      });
    }
    
    throw new Error('Unsupported file type for story');
  }

  // Utility method for post-specific compression
  static async compressForPost(file: File): Promise<Blob> {
    if (file.type.startsWith('image/')) {
      return this.compressImage(file, {
        maxWidth: 1080,
        maxHeight: 1350,
        quality: 0.85,
        format: 'jpeg',
        targetSize: 200 * 1024 // 200KB
      });
    } else if (file.type.startsWith('video/')) {
      return this.compressVideo(file, {
        maxBitrate: '5M',
        maxWidth: 1080,
        maxHeight: 1350
      });
    }
    
    throw new Error('Unsupported file type for post');
  }
}