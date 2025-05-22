import { useState, useEffect, useRef } from 'react';
import { Grid, List, Calendar, Trash, Plus, Film, Sparkles, AlertCircle, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMediaStore } from '../store/mediaStore';
import { useCollectionStore } from '../store/collectionStore';
import { groupMediaByDate, constructMediaUrl } from '../utils/mediaUtils';
import { Media } from '../lib/supabase';
import { Check } from './Check';
import { MediaLightbox } from './MediaLightbox';

import { Modal } from './Modal';
import { QuickStoryDisplay } from '../utils/parseMarkdown';
import ExportButton from './ExportButton';

type ViewMode = 'grid' | 'timeline';

// Define error message type
interface ErrorMessageType {
  message: string;
  type: 'format' | 'access' | 'processing' | 'general';
}

function MediaGallery() {
  const { media, loading: loadingMediaStore, fetchMedia, deleteMedia } = useMediaStore();
  const { createCollection } = useCollectionStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupedMedia, setGroupedMedia] = useState<{
    date: string;
    displayDate: string;
    items: Media[];
  }[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [showCollectionNameModal, setShowCollectionNameModal] = useState(false);
  
  // Add state for delete confirmation
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  // State for Quick Story Modal
  const [isQuickStoryModalOpen, setIsQuickStoryModalOpen] = useState(false);
  const [imagesForQuickStory, setImagesForQuickStory] = useState<Media[]>([]);
  const [quickStoryResult, setQuickStoryResult] = useState<{ summary: string; prompts: string[] } | null>(null);
  const [isGeneratingQuickStory, setIsGeneratingQuickStory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessageType | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
  const MAX_IMAGES_FOR_COLLAGE = 5;
  
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);
  
  useEffect(() => {
    if (media.length > 0) {
      const grouped = groupMediaByDate(media);
      setGroupedMedia(grouped as {
        date: string;
        displayDate: string;
        items: Media[];
      }[]);
    }
  }, [media]);
  
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  const handleCreateCollection = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to create a collection.");
      return;
    }
    
    // Open the modal to enter collection name
    setShowCollectionNameModal(true);
  };
  
  const submitCreateCollection = async () => {
    if (!collectionName.trim()) {
      alert("Please enter a collection name.");
      return;
    }
    
    setIsCreatingCollection(true);
    try {
      await createCollection(collectionName, selectedItems);
      setSelectedItems([]); // Clear selection after creating collection
      setCollectionName(''); // Clear the collection name
      setShowCollectionNameModal(false); // Close the modal
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setIsCreatingCollection(false);
    }
  };
  
  const handleOpenQuickStoryModal = () => {
    if (selectedItems.length === 0) {
        alert("Please select images first.");
        return;
    }
    if (selectedItems.length > MAX_IMAGES_FOR_COLLAGE) {
        alert(`Please select no more than ${MAX_IMAGES_FOR_COLLAGE} images for a quick story.`);
        return;
    }
    const selectedMediaObjects = media.filter(m => selectedItems.includes(m.id));
    setImagesForQuickStory(selectedMediaObjects);
    setQuickStoryResult(null); // Reset previous result
    setIsGeneratingQuickStory(false);
    setIsQuickStoryModalOpen(true);
  };

  const handleGenerateQuickStory = async () => {
    // Reset error message at the start
    setErrorMessage(null);
    
    if (imagesForQuickStory.length === 0) {
      alert("No images selected for the story.");
      return;
    }

    const mediaItemsForApi = imagesForQuickStory.map(img => {
      // Use our utility function to get proper URLs
      const imageUrl = constructMediaUrl(img.thumbnail_url || img.file_path);
      
      return {
        image_url: imageUrl,
        file_name: img.file_name,
        taken_at: img.taken_at,
        location: img.location
      };
    });

    setIsGeneratingQuickStory(true);
    setQuickStoryResult(null);

    try {
      console.log("Sending to API:", JSON.stringify(mediaItemsForApi));
      
      const response = await fetch(`${FASTAPI_BASE_URL}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_items: mediaItemsForApi }),
      });

      if (!response.ok) {
        let userFriendlyMessage = "Unable to generate story. Please try again later.";
        
        try {
          const errorData = await response.json();
          console.error("API Error Details:", errorData);
          
          // Log the raw error for debugging
          console.log("Raw error response:", JSON.stringify(errorData, null, 2));
          
          // Extract the actual error message from the Groq API response
          if (errorData.detail && typeof errorData.detail === 'string') {
            // Log the detail for debugging
            console.log("Error detail:", errorData.detail);
            
            const groqErrorMatch = errorData.detail.match(/Groq API error:.*Response: ({.*})/);
            if (groqErrorMatch) {
              try {
                const groqErrorJson = JSON.parse(groqErrorMatch[1]);
                console.log("Parsed Groq error:", groqErrorJson);
                
                if (groqErrorJson.error && groqErrorJson.error.message) {
                  userFriendlyMessage = groqErrorJson.error.message;
                  console.log("Extracted error message:", userFriendlyMessage);
                }
              } catch (parseError) {
                console.error("Error parsing Groq error JSON:", parseError);
              }
            } else {
              // If not a Groq specific error, use the FastAPI error detail
              userFriendlyMessage = errorData.detail;
            }
          } else if (errorData.error && errorData.error.message) {
            userFriendlyMessage = errorData.error.message;
          }
        } catch (err) {
          // If we can't parse the response as JSON, log the error
          console.error("Error parsing error response:", err);
        }
        
        // Always set error type to format for specific keywords 
        // regardless of where they appear in the error message
        let errorType: 'format' | 'access' | 'processing' | 'general' = "general";
        
        // Convert to lowercase for case-insensitive matching
        const lowerCaseError = userFriendlyMessage.toLowerCase();
        console.log("Lowercase error for matching:", lowerCaseError);
        
        // Check for format-related errors with broader matching
        if (lowerCaseError.includes('gif') || 
            lowerCaseError.includes('animated') || 
            lowerCaseError.includes('format') ||
            lowerCaseError.includes('not supported') ||
            lowerCaseError.includes('unsupported') ||
            lowerCaseError.includes('file type') ||
            lowerCaseError.includes('image type')) {
          
          console.log("Detected format error");
          userFriendlyMessage = "Animated GIFs and other unsupported formats cannot be processed. Please select only static JPEG or PNG images.";
          errorType = "format";
          
        } else if (lowerCaseError.includes('fetch') || 
                 lowerCaseError.includes('url') || 
                 lowerCaseError.includes('access') ||
                 lowerCaseError.includes('timeout') ||
                 lowerCaseError.includes('timed out')) {
                 
          console.log("Detected access error");
          userFriendlyMessage = "Unable to access one or more of your images. Please ensure they are accessible.";
          errorType = "access";
          
        } else if (lowerCaseError.includes('invalid') || 
                  lowerCaseError.includes('error') ||
                  lowerCaseError.includes('size') ||
                  lowerCaseError.includes('large')) {
                  
          console.log("Detected processing error");
          userFriendlyMessage = "There was an issue processing your images. Please try different images.";
          errorType = "processing";
        } else {
          console.log("Using general error type for:", lowerCaseError);
        }
        
        // Always show format info for any error to be more helpful
        errorType = "format"; 
        
        console.log("Final error type:", errorType);
        console.log("Final error message:", userFriendlyMessage);
        
        // Set the error message in state r instead of showing an alert
        setErrorMessage({ message: userFriendlyMessage, type: errorType });
        throw new Error(userFriendlyMessage);
      }

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("Raw API response:", responseText);
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed API response:", data);
      } catch (err) {
        console.error("Error parsing API response:", err);
        throw new Error("We received an invalid response. Please try again.");
      }
      
      // Validate and sanitize the response data
      if (!data.summary || typeof data.summary !== 'string') {
        console.error("Invalid summary in API response:", data);
        throw new Error("We couldn't generate a story from these images. Please try different images.");
      }
      
      // Clean up summary by removing any $2 placeholders that might be in the response
      const cleanSummary = data.summary.replace(/\$2/g, '').trim();
      
      // Make sure prompts are in the right format
      const cleanPrompts = Array.isArray(data.prompts) 
        ? data.prompts.map((p: unknown) => typeof p === 'string' ? p.replace(/\$2/g, '').trim() : '')
        : [];
        
      const cleanData = {
        summary: cleanSummary,
        prompts: cleanPrompts.filter((p: string) => p !== '')
      };

      console.log("Cleaned data to display:", cleanData);
      setQuickStoryResult(cleanData);
    } catch (error) {
      console.error("Error generating quick story:", error);
      // Don't show alert since we're using the error message state
      setQuickStoryResult(null);
    } finally {
      setIsGeneratingQuickStory(false);
    }
  };
  
  const handleDeleteMedia = (id: string) => {
    setMediaToDelete(id);
    setShowDeleteConfirmModal(true);
  };
  
  const confirmDelete = async () => {
    if (mediaToDelete) {
      await deleteMedia(mediaToDelete);
      setMediaToDelete(null);
      setShowDeleteConfirmModal(false);
    }
  };
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  if (loadingMediaStore && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700">No media found</h3>
        <p className="text-gray-500 mt-1">Upload photos and videos to start creating collections</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200`}
          >
            <Grid className="w-4 h-4 inline mr-1" /> Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'timeline'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200`}
          >
            <List className="w-4 h-4 inline mr-1" /> Timeline
          </button>
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleCreateCollection}
              disabled={isCreatingCollection}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Save as Collection
            </button>
            <button
              onClick={handleOpenQuickStoryModal}
              className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4 inline mr-1" /> Quick Story
            </button>
          </div>
        )}
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item: Media, index: number) => (
            <MediaGridItem
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => toggleItemSelection(item.id)}
              onDelete={() => handleDeleteMedia(item.id)}
              onMaximize={() => openLightbox(index)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedMedia.map(group => (
            <div key={group.date} className="space-y-3">
              <h3 className="text-lg font-medium text-gray-700 sticky top-0 bg-gray-50 py-2 z-10">
                {group.displayDate}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {group.items.map((item: Media) => {
                  // Find index in the main media array
                  const mainIndex = media.findIndex(m => m.id === item.id);
                  return (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                      index={mainIndex === -1 ? 0 : mainIndex}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                      onDelete={() => handleDeleteMedia(item.id)}
                      onMaximize={() => openLightbox(mainIndex === -1 ? 0 : mainIndex)}
                  />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Story Modal */}
      <Modal
        isOpen={isQuickStoryModalOpen}
        onClose={() => {
          setIsQuickStoryModalOpen(false);
          setErrorMessage(null); // Clear error when closing modal
        }}
        title="Generate Quick AI Story"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Generating a story for {imagesForQuickStory.length} selected image(s):
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded">
              {imagesForQuickStory.map(img => (
                <div key={img.id} className="flex items-center gap-2 p-1 border rounded text-xs">
                  {img.file_type?.startsWith('image/') ? (
                    <img src={img.thumbnail_url || img.file_path} alt={img.file_name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <Film size={16} className="text-gray-400"/>
                  )}
                  <span className="truncate max-w-[100px]">{img.file_name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Error message display */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{errorMessage.message}</p>
                  
                  {errorMessage.type === 'format' && (
                    <div className="mt-2 text-xs text-red-700">
                      <p className="font-semibold">Supported formats:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>Static images (JPEG, PNG)</li>
                        <li>Maximum file size: 20MB</li>
                      </ul>
                      <p className="mt-1">Unsupported: Animated GIFs, videos, SVGs</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleGenerateQuickStory}
            disabled={isGeneratingQuickStory || imagesForQuickStory.length === 0}
            className={`w-full px-4 py-2 rounded-md ${
              isGeneratingQuickStory || imagesForQuickStory.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isGeneratingQuickStory ? 'Generating...' : '✨ Generate Story ✨'}
          </button>

          <QuickStoryDisplay
            collageData={quickStoryResult}
            isLoading={isGeneratingQuickStory}
            exportRef={exportRef}
          />
          {quickStoryResult && !isGeneratingQuickStory && (
            <ExportButton targetRef={exportRef} />
          )}
        </div>
      </Modal>

      {/* Collection Name Modal */}
      <Modal
        isOpen={showCollectionNameModal}
        onClose={() => setShowCollectionNameModal(false)}
        title="Create New Collection"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              id="collection-name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a name for your collection"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCollectionNameModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitCreateCollection}
              disabled={isCreatingCollection || !collectionName.trim()}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                isCreatingCollection || !collectionName.trim() 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isCreatingCollection ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this media item? This action cannot be undone.
          </p>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      <MediaLightbox 
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={media}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

interface MediaGridItemProps {
  item: Media;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMaximize: () => void;
}

function MediaGridItem({ item, index, isSelected, onSelect, onDelete, onMaximize }: MediaGridItemProps) {
  const isImage = item.file_type?.startsWith('image/');
  
  // Get proper thumbnail URL
  const thumbnailUrl = constructMediaUrl(item.thumbnail_url);
  
  // Debug image URLs
  console.log('MediaGridItem - Image URLs:', { 
    id: item.id,
    thumbnail_url: item.thumbnail_url,
    thumbnail_url_full: thumbnailUrl,
    file_path: item.file_path 
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative rounded-lg overflow-hidden border-2 ${
        isSelected ? 'border-indigo-500' : 'border-transparent'
      } transition-colors duration-200 group`}
    >
      <div 
        className="aspect-square bg-gray-100 cursor-pointer"
        onClick={onSelect}
      >
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={item.file_name}
            className="object-cover w-full h-full"
            onError={(e) => {
              console.error('Error loading thumbnail:', thumbnailUrl);
              e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Image';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-700 text-white rounded">
            <Film className="h-12 w-12 text-gray-400" />
            <span className="ml-2 text-sm">Video</span>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="p-2 bg-indigo-500 rounded-full text-white hover:bg-indigo-600"
          title={isSelected ? "Deselect" : "Select media"}
        >
          {isSelected ? <Check size={16} /> : <Plus size={16} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
          title="Delete media"
        >
          <Trash size={16} />
        </button>
      </div>
      
      {/* Maximize button */}
      <button
        onClick={(e) => { e.stopPropagation(); onMaximize(); }}
        className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
        title="View full size"
      >
        <Maximize2 size={14} className="text-white" />
      </button>
      
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">
          {item.file_name}
        </p>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
          <Check size={12} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default MediaGallery;