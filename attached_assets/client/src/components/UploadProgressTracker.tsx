import React from 'react';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'compressing' | 'completed' | 'error';
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
}

interface UploadProgressTrackerProps {
  uploads: UploadProgress[];
  isDarkMode?: boolean;
}

export const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({
  uploads,
  isDarkMode = false
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'compressing':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'compressing':
        return `Compressing... ${upload.progress}%`;
      case 'uploading':
        return `Uploading... ${upload.progress}%`;
      case 'completed':
        return upload.compressionRatio 
          ? `Compressed ${upload.compressionRatio}% - Saved ${formatFileSize((upload.originalSize || 0) - (upload.compressedSize || 0))}`
          : 'Upload complete';
      case 'error':
        return upload.error || 'Upload failed';
    }
  };

  if (uploads.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className={`p-4 rounded-lg backdrop-blur-md border transition-all duration-300 ${
            isDarkMode
              ? 'bg-gray-900/90 border-gray-700/50'
              : 'bg-white/90 border-gray-200/50'
          } shadow-lg`}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(upload.status)}
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {upload.fileName}
              </div>
              
              <div className="text-xs opacity-70 mt-1">
                {getStatusText(upload)}
              </div>
              
              {upload.originalSize && upload.compressedSize && upload.status === 'completed' && (
                <div className="text-xs opacity-60 mt-1">
                  {formatFileSize(upload.originalSize)} → {formatFileSize(upload.compressedSize)}
                </div>
              )}
              
              {(upload.status === 'uploading' || upload.status === 'compressing') && (
                <div className="mt-2">
                  <div className={`w-full h-1 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};