// Enhanced Image Format Support including HEIC/HEIF conversion
import { compressImage } from './imageCompression';

// Check if HEIC/HEIF format is supported
export const isHeicFormat = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  return (
    fileName.endsWith('.heic') || 
    fileName.endsWith('.heif') ||
    mimeType === 'image/heic' ||
    mimeType === 'image/heif'
  );
};

// Convert HEIC/HEIF to JPEG using canvas-based approach
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Set canvas dimensions to image size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert HEIC to JPEG'));
            return;
          }
          
          // Create new File object with JPEG format
          const convertedFile = new File(
            [blob], 
            file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
            { type: 'image/jpeg' }
          );
          
          resolve(convertedFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load HEIC image'));
      };
      
      // Try to load the image directly (works in newer browsers)
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read HEIC file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Comprehensive file format validation
export const validateImageFormat = (file: File): { isValid: boolean; errorMessage?: string } => {
  const supportedFormats = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif', 'image/avif'
  ];
  
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  // Check by MIME type
  const isSupportedMime = supportedFormats.includes(mimeType);
  
  // Check by file extension (especially for HEIC files from iOS)
  const isSupportedExtension = 
    fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') || fileName.endsWith('.gif') ||
    fileName.endsWith('.webp') || fileName.endsWith('.bmp') ||
    fileName.endsWith('.tiff') || fileName.endsWith('.svg') ||
    fileName.endsWith('.heic') || fileName.endsWith('.heif') ||
    fileName.endsWith('.avif');
  
  if (!isSupportedMime && !isSupportedExtension) {
    return {
      isValid: false,
      errorMessage: 'Nicht unterstütztes Bildformat. Erlaubte Formate: JPG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF, AVIF'
    };
  }
  
  return { isValid: true };
};

// Process image file with format conversion and compression
export const processImageFile = async (file: File, maxSizeKB: number = 200): Promise<File> => {
  // Validate format first
  const validation = validateImageFormat(file);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage);
  }
  
  let processedFile = file;
  
  // Convert HEIC/HEIF to JPEG if needed
  if (isHeicFormat(file)) {
    console.log('📸 Converting HEIC/HEIF to JPEG...');
    try {
      processedFile = await convertHeicToJpeg(file);
      console.log('✅ HEIC/HEIF conversion successful');
    } catch (error) {
      console.error('❌ HEIC/HEIF conversion failed:', error);
      throw new Error('HEIC/HEIF Konvertierung fehlgeschlagen. Bitte verwenden Sie ein anderes Format.');
    }
  }
  
  // Compress the image using correct options
  try {
    const compressedFile = await compressImage(processedFile, { 
      targetSizeKB: maxSizeKB,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    });
    console.log(`📸 Image processed: ${file.name} -> ${compressedFile.name} (${(compressedFile.size / 1024).toFixed(1)}KB)`);
    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    throw new Error('Bildkomprimierung fehlgeschlagen.');
  }
};