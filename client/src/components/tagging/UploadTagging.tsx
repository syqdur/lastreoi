import React, { useState, useCallback } from 'react';
import { X, Upload, Copy } from 'lucide-react';
import { MediaTag, GalleryUser } from '../../types/tagging';
import InstagramTagging from './InstagramTagging';
import NotificationService from '../../services/notificationService';

interface UploadTaggingProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: MediaTag[]) => void;
  files: File[];
  galleryUsers: GalleryUser[];
  galleryId: string;
}

const UploadTagging: React.FC<UploadTaggingProps> = ({
  isOpen,
  onClose,
  onConfirm,
  files,
  galleryUsers,
  galleryId
}) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileTags, setFileTags] = useState<{ [key: number]: MediaTag[] }>({});
  const [bulkTaggingMode, setBulkTaggingMode] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Generate preview URLs for files
  React.useEffect(() => {
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
      
      // Cleanup URLs on unmount
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [files]);

  const currentFile = files[currentFileIndex];
  const currentPreviewUrl = previewUrls[currentFileIndex];
  const currentTags = fileTags[currentFileIndex] || [];
  const totalFiles = files.length;

  // Handle tagging for current file
  const handleTaggingConfirm = useCallback((tags: MediaTag[]) => {
    setFileTags(prev => ({
      ...prev,
      [currentFileIndex]: tags
    }));

    // If bulk tagging mode is enabled, apply tags to all files
    if (bulkTaggingMode) {
      const newFileTags: { [key: number]: MediaTag[] } = {};
      for (let i = 0; i < totalFiles; i++) {
        newFileTags[i] = tags;
      }
      setFileTags(newFileTags);
    }

    setShowTaggingModal(false);
  }, [currentFileIndex, bulkTaggingMode, totalFiles]);

  // Navigate between files
  const goToNextFile = useCallback(() => {
    if (currentFileIndex < totalFiles - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  }, [currentFileIndex, totalFiles]);

  const goToPreviousFile = useCallback(() => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  }, [currentFileIndex]);

  // Apply current file's tags to all files
  const applyTagsToAll = useCallback(() => {
    const currentFileTags = fileTags[currentFileIndex] || [];
    if (currentFileTags.length === 0) return;

    const newFileTags: { [key: number]: MediaTag[] } = {};
    for (let i = 0; i < totalFiles; i++) {
      newFileTags[i] = [...currentFileTags];
    }
    setFileTags(newFileTags);
  }, [currentFileIndex, fileTags, totalFiles]);

  // Confirm and send all tags
  const handleConfirm = useCallback(async () => {
    // Collect all tags from all files
    const allTags: MediaTag[] = [];
    Object.values(fileTags).forEach(tags => {
      allTags.push(...tags);
    });

    // Send bulk tagging notifications if there are person tags
    const personTags = allTags.filter(tag => tag.type === 'person');
    if (personTags.length > 0) {
      const currentUser = NotificationService.getCurrentUserName();
      const currentDisplayName = NotificationService.getCurrentDisplayName();
      
      if (currentUser) {
        // Create media items for notification
        const mediaItems = files.map((file, index) => ({
          id: `upload_${Date.now()}_${index}`,
          url: previewUrls[index] || '',
          type: file.type.startsWith('video') ? 'video' as const : 'image' as const
        }));

        await NotificationService.sendBulkTaggingNotifications(
          galleryId,
          mediaItems,
          allTags,
          currentUser,
          currentDisplayName || undefined
        );
      }
    }

    onConfirm(allTags);
    onClose();
  }, [fileTags, files, previewUrls, galleryId, onConfirm, onClose]);

  // Get file type
  const getFileType = (file: File): 'image' | 'video' => {
    return file.type.startsWith('video') ? 'video' : 'image';
  };

  // Count total tags across all files
  const getTotalTagsCount = () => {
    return Object.values(fileTags).reduce((total, tags) => total + tags.length, 0);
  };

  // Count unique person tags
  const getUniquePersonTagsCount = () => {
    const allPersonTags = Object.values(fileTags).flat().filter(tag => tag.type === 'person');
    const uniqueDeviceIds = new Set(allPersonTags.map(tag => tag.deviceId));
    return uniqueDeviceIds.size;
  };

  if (!isOpen || !currentFile) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold">Dateien markieren</h2>
                  <p className="text-sm text-gray-500">
                    {currentFileIndex + 1} von {totalFiles} Dateien
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getTotalTagsCount() > 0 && (
                  <div className="text-sm text-gray-500">
                    {getTotalTagsCount()} Tags, {getUniquePersonTagsCount()} Personen
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fertig
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* File Preview */}
            <div className="relative mb-6">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
                {currentPreviewUrl && (
                  getFileType(currentFile) === 'image' ? (
                    <img
                      src={currentPreviewUrl}
                      alt={`Preview ${currentFileIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={currentPreviewUrl}
                      className="max-w-full max-h-full object-contain"
                      controls
                      preload="metadata"
                    />
                  )
                )}
              </div>

              {/* Navigation */}
              {totalFiles > 1 && (
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                  {currentFileIndex > 0 && (
                    <button
                      onClick={goToPreviousFile}
                      className="ml-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 pointer-events-auto"
                    >
                      ←
                    </button>
                  )}
                  {currentFileIndex < totalFiles - 1 && (
                    <button
                      onClick={goToNextFile}
                      className="mr-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 pointer-events-auto"
                    >
                      →
                    </button>
                  )}
                </div>
              )}

              {/* File indicator */}
              {totalFiles > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {files.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFileIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentFileIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Multi-file bulk tagging */}
              {totalFiles > 1 && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">Für alle Dateien markieren</span>
                  </div>
                  <button
                    onClick={() => setBulkTaggingMode(!bulkTaggingMode)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      bulkTaggingMode 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {bulkTaggingMode ? 'Aktiv' : 'Aktivieren'}
                  </button>
                </div>
              )}

              {/* Tagging actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTaggingModal(true)}
                  className="flex-1 flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
                >
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-600 font-medium">
                    {currentTags.length > 0 ? 'Tags bearbeiten' : 'Personen & Orte markieren'}
                  </span>
                  {currentTags.length > 0 && (
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                      {currentTags.length}
                    </span>
                  )}
                </button>

                {/* Apply tags to all */}
                {totalFiles > 1 && currentTags.length > 0 && (
                  <button
                    onClick={applyTagsToAll}
                    className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-xl transition-colors"
                  >
                    Auf alle anwenden
                  </button>
                )}
              </div>

              {/* Current file tags summary */}
              {currentTags.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <h4 className="text-sm font-medium mb-2">Markierungen für diese Datei:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map(tag => (
                      <span
                        key={tag.id}
                        className={`px-2 py-1 text-xs rounded-full ${
                          tag.type === 'person' ? 'bg-purple-100 text-purple-700' :
                          tag.type === 'location' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {tag.type === 'person' && (tag.displayName || tag.userName)}
                        {tag.type === 'location' && tag.name}
                        {tag.type === 'text' && tag.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Tagging Modal */}
      {showTaggingModal && currentPreviewUrl && (
        <InstagramTagging
          isOpen={showTaggingModal}
          onClose={() => setShowTaggingModal(false)}
          onConfirm={handleTaggingConfirm}
          mediaUrl={currentPreviewUrl}
          mediaType={getFileType(currentFile)}
          galleryUsers={galleryUsers}
          initialTags={currentTags}
        />
      )}
    </>
  );
};

export default UploadTagging;