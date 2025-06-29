import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Loader } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { MediaCompressor } from '../../utils/media/MediaCompressor';

interface StoryUploadProps {
  onUpload: (file: Blob, type: 'image' | 'video') => Promise<void>;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const StoryUpload: React.FC<StoryUploadProps> = ({
  onUpload,
  onClose,
  isDarkMode = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processAndUpload = async (file: File) => {
    setIsUploading(true);
    setCompressionProgress(0);

    try {
      let compressedFile: Blob;
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        // Video compression with progress callback
        compressedFile = await MediaCompressor.compressVideo(
          file,
          {
            maxBitrate: '2M',
            maxWidth: 1080,
            maxHeight: 1920
          },
          (progress) => setCompressionProgress(progress)
        );
      } else {
        // Image compression for stories
        compressedFile = await MediaCompressor.compressForStory(file);
        setCompressionProgress(100);
      }

      await onUpload(compressedFile, isVideo ? 'video' : 'image');
      onClose();
    } catch (error) {
      console.error('Failed to process and upload story:', error);
      alert('Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
      setCompressionProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await processAndUpload(acceptedFiles[0]);
      }
    },
    disabled: isUploading
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Failed to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to story dimensions (9:16 aspect ratio)
    canvas.width = 1080;
    canvas.height = 1920;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        stopCamera();
        await processAndUpload(new File([blob], 'story-photo.jpg', { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.9);
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black">
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
            <button
              onClick={stopCamera}
              className="p-3 bg-gray-600/80 text-white rounded-full transition-colors hover:bg-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <button
              onClick={capturePhoto}
              className="p-6 bg-white rounded-full transition-transform hover:scale-105 active:scale-95"
            >
              <div className="w-4 h-4 bg-black rounded-full" />
            </button>
          </div>
          
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add to Story</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isUploading && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {compressionProgress === 0 ? 'Processing...' : `Compressing... ${compressionProgress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${compressionProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Camera Option */}
          <button
            onClick={startCamera}
            disabled={isUploading}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all ${
              isUploading
                ? 'opacity-50 cursor-not-allowed'
                : isDarkMode
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Camera className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="font-medium">Take Photo</div>
              <div className="text-sm opacity-70">Use camera to capture a story</div>
            </div>
          </button>

          {/* File Upload */}
          <div
            {...getRootProps()}
            className={`w-full p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10'
                : isUploading
                ? 'opacity-50 cursor-not-allowed border-gray-300'
                : isDarkMode
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} disabled={isUploading} />
            
            <div className="text-center">
              <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-3">
                <Upload className="w-6 h-6 text-purple-500" />
              </div>
              
              <div className="font-medium mb-1">
                {isDragActive ? 'Drop file here' : 'Upload Photo or Video'}
              </div>
              
              <div className="text-sm opacity-70">
                Drag and drop or click to select
              </div>
              
              <div className="text-xs opacity-50 mt-2">
                Supports JPG, PNG, GIF, WebP, MP4, MOV (up to 100MB)
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-xs opacity-70">
            Stories automatically disappear after 24 hours
          </div>
        </div>
      </div>
    </div>
  );
};