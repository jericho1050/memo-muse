import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Image as ImageIcon, Film, Bug, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Media } from '../lib/supabase';
import { constructMediaUrl, getProperMimeType, isSupportedVideoFormat, needsConversion } from '../utils/mediaUtils';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: Media[];
  initialIndex?: number;
}

export function MediaLightbox({ isOpen, onClose, media, initialIndex = 0 }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Reset index and error state when media changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageError(false);
  }, [media, initialIndex]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'Escape':
          onClose();
          break;
        case 'd': // Press 'd' to toggle debug info
          if (e.ctrlKey) {
            e.preventDefault();
            setShowDebugInfo(prev => !prev);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, media.length]);
  
  if (!isOpen || media.length === 0) return null;
  
  const currentMedia = media[currentIndex];
  const isVideo = currentMedia.file_type?.startsWith('video/');
  
  // Get full URLs
  const mediaUrl = constructMediaUrl(currentMedia.file_path);
  const thumbnailUrl = constructMediaUrl(currentMedia.thumbnail_url);
  
  // Get proper MIME type for videos
  const videoMimeType = getProperMimeType(currentMedia.file_type, currentMedia.file_name);
  const isUnsupportedVideoFormat = isVideo && !isSupportedVideoFormat(currentMedia.file_type, currentMedia.file_name);
  const requiresConversion = needsConversion(currentMedia.file_type, currentMedia.file_name);
  
  // Debug info - more detailed
  console.log('MediaLightbox - Current media URLs:', {
    id: currentMedia.id,
    file_name: currentMedia.file_name,
    file_type: currentMedia.file_type,
    mime_type: videoMimeType,
    is_supported: !isUnsupportedVideoFormat,
    needs_conversion: requiresConversion,
    thumbnail_url: currentMedia.thumbnail_url,
    thumbnail_url_full: thumbnailUrl,
    file_path: currentMedia.file_path,
    file_path_full: mediaUrl
  });
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    setIsPlaying(false);
    setImageError(false);
  };
  
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    setIsPlaying(false);
    setImageError(false);
  };
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    // Get video element and toggle play/pause
    const videoElement = document.getElementById('lightbox-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-90">
      {/* Image dimensions display */}
      <div className="absolute top-4 left-4 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded">
        {currentMedia.width && currentMedia.height 
          ? `${currentMedia.width}px × ${currentMedia.height}px` 
          : 'Dimensions unknown'}
      </div>
      
      {/* Debug button */}
      <button 
        className="absolute top-4 left-20 p-2 text-white/60 bg-black/30 rounded-full hover:bg-black/50 hover:text-white/80 z-50"
        onClick={() => setShowDebugInfo(prev => !prev)}
        title="Toggle debug info (Ctrl+D)"
      >
        <Bug size={16} />
      </button>
      
      {/* Close button */}
      <button 
        className="absolute top-4 right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 z-50"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      
      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button 
            className="absolute left-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 z-40"
            onClick={goToPrev}
          >
            <ChevronLeft size={28} />
          </button>
          <button 
            className="absolute right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 z-40"
            onClick={goToNext}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
      
      {/* Media counter */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      )}
      
      {/* Debug info panel */}
      {showDebugInfo && (
        <div className="absolute top-14 left-4 bg-black/70 text-white/90 p-4 rounded text-xs max-w-[400px] max-h-[500px] overflow-auto z-50">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <div className="space-y-2">
            <p><span className="font-bold">ID:</span> {currentMedia.id}</p>
            <p><span className="font-bold">File Name:</span> {currentMedia.file_name}</p>
            <p><span className="font-bold">File Type:</span> {currentMedia.file_type}</p>
            <p><span className="font-bold">Width:</span> {currentMedia.width || 'unknown'}</p>
            <p><span className="font-bold">Height:</span> {currentMedia.height || 'unknown'}</p>
            <p><span className="font-bold">Thumbnail URL:</span> {currentMedia.thumbnail_url || 'N/A'}</p>
            <p><span className="font-bold">Full Thumbnail URL:</span> {thumbnailUrl || 'N/A'}</p>
            <p><span className="font-bold">File Path:</span> {currentMedia.file_path || 'N/A'}</p>
            <p><span className="font-bold">Full Media URL:</span> {mediaUrl || 'N/A'}</p>
          </div>
        </div>
      )}
      
      {/* Media content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full flex items-center justify-center p-4"
        >
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {isUnsupportedVideoFormat ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <Film size={64} className="text-gray-400 mb-4" />
                  <p>Unsupported Video Format</p>
                  <p className="text-sm text-gray-400 mt-2 max-w-md text-center">
                    {requiresConversion ? 
                      "This video format (MOV/QuickTime) isn't supported directly in the browser." : 
                      "This video format isn't supported in your browser."}
                  </p>
                  <a 
                    href={mediaUrl}
                    download={currentMedia.file_name}
                    className="mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
                  >
                    <Download size={14} /> Download Video
                  </a>
                </div>
              ) : (
                <>
                  <video
                    id="lightbox-video"
                    className="max-w-full max-h-[80vh] object-contain"
                    controls
                    autoPlay={false}
                    loop
                    playsInline
                    onError={(e) => {
                      console.error('Video loading error:', mediaUrl);
                      const videoElement = e.currentTarget;
                      videoElement.classList.add('hidden');
                      const container = videoElement.parentElement;
                      if (container) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = "flex flex-col items-center justify-center text-white";
                        errorMsg.innerHTML = `
                          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mb-4">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                          </svg>
                          <p>Unable to play video</p>
                          <p class="text-sm text-gray-400 mt-2 max-w-md text-center">
                            This video format may not be supported in your browser. Try downloading the file to play it locally.
                          </p>
                        `;
                        container.appendChild(errorMsg);
                      }
                    }}
                  >
                    <source src={mediaUrl} type={videoMimeType} />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Video controls */}
                  <button 
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  {/* Add download option for videos */}
                  <a 
                    href={mediaUrl}
                    download={currentMedia.file_name}
                    className="absolute bottom-8 right-8 p-2 text-white bg-black bg-opacity-50 rounded-md hover:bg-opacity-70 text-sm flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} /> Download
                  </a>
                </>
              )}
            </div>
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center text-white">
              <ImageIcon size={64} className="text-gray-400 mb-4" />
              <p>Unable to load image</p>
              <p className="text-sm text-gray-400 mt-2 max-w-md text-center">
                The image could not be displayed. It may be inaccessible or in an unsupported format.
              </p>
              {/* Add download option for images with errors */}
              <a 
                href={mediaUrl}
                download={currentMedia.file_name}
                className="mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
              >
                <Download size={14} /> Download Image
              </a>
            </div>
          ) : (
            <div className="relative">
              <img
                src={thumbnailUrl || mediaUrl || 'https://placehold.co/800x600/f3f4f6/a1a1aa?text=Image+Not+Available'}
                alt={currentMedia.file_name || 'Media'}
                className="max-w-full max-h-[90vh] object-contain"
                onError={(e) => {
                  console.error('Image loading error:', thumbnailUrl || mediaUrl); 
                  e.currentTarget.src = 'https://placehold.co/800x600/f3f4f6/a1a1aa?text=Image+Not+Available';
                  // Don't set image error to true immediately, give the placeholder a chance
                  setTimeout(() => {
                    if (e.currentTarget.src.includes('placehold.co')) {
                      setImageError(true);
                    }
                  }, 500);
                }}
              />
              {/* Add download button for images */}
              <a 
                href={mediaUrl}
                download={currentMedia.file_name}
                className="absolute bottom-4 right-4 p-2 text-white bg-black bg-opacity-50 rounded-md hover:bg-opacity-70 text-sm flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} /> Download
              </a>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* File name and metadata */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded text-sm max-w-[80%] truncate">
        {currentMedia.file_name || 'Untitled'}
      </div>
    </div>
  );
} 