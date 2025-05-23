import React, { useState, useEffect } from 'react';
import DraggableCollageCreator from './DraggableCollageCreator';
import { useMediaStore } from '../store/mediaStore';
import { constructMediaUrl } from '../utils/mediaUtils';

// Define TypeScript interfaces
interface CollageImage {
  id: string;
  supabaseUrl: string;
  fileName?: string;
  taken_at?: string;
  location?: string;
}

interface CollageData {
  summary: string;
  prompts?: string[];
}

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageGridProps {
  images: CollageImage[];
  selectedImageIds: Set<string>;
  onToggleSelectImage: (id: string) => void;
}

interface SelectedImagesActionsProps {
  selectedImageIds: Set<string>;
  onGenerateCollage: () => void;
  isLoading: boolean;
  maxImagesAllowed: number;
  onCreateCollage: () => void;
}

interface CollageDisplayProps {
  collageData: CollageData | null;
}

// --- Helper/Child Component Stubs (You'll need to create these) ---

// ImageGrid: Displays images and handles selection
const ImageGrid: React.FC<ImageGridProps> = ({ images, selectedImageIds, onToggleSelectImage }) => {
  if (!images || images.length === 0) {
    return <p>No images uploaded yet. Upload some images to get started!</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {images.map((image) => (
        <div 
          key={image.id} 
          onClick={() => onToggleSelectImage(image.id)}
          className={`border-2 ${selectedImageIds.has(image.id) ? 'border-blue-500' : 'border-transparent'} p-2 cursor-pointer text-center rounded-md hover:bg-gray-50`}
        >
          <img src={image.supabaseUrl} alt={image.fileName || 'Uploaded image'} className="w-full h-24 object-cover rounded" />
          <p className="text-xs mt-1 truncate">{image.fileName || image.id}</p>
        </div>
      ))}
    </div>
  );
};

// SelectedImagesActions: Button to generate collage for selected items
const SelectedImagesActions: React.FC<SelectedImagesActionsProps> = ({ 
  selectedImageIds, 
  onGenerateCollage, 
  isLoading, 
  maxImagesAllowed,
  onCreateCollage 
}) => {
  const selectedCount = selectedImageIds.size;

  const handleGenerateClick = () => {
    if (selectedCount === 0) {
      alert('Please select at least one image.');
      return;
    }
    if (selectedCount > maxImagesAllowed) {
      alert(`You can select a maximum of ${maxImagesAllowed} images.`);
      return;
    }
    onGenerateCollage();
  };

  return (
    <div className="my-5 flex flex-wrap gap-3 items-center">
      <p>{selectedCount} image(s) selected.</p>
      <div className="flex gap-2">
        <button 
          onClick={handleGenerateClick} 
          disabled={isLoading || selectedCount === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700"
        >
          {isLoading ? 'Generating Story...' : 'Generate Story'}
        </button>
        
        <button 
          onClick={onCreateCollage}
          disabled={selectedCount === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-purple-300 hover:bg-purple-700"
        >
          Create Collage
        </button>
      </div>
      {selectedCount > maxImagesAllowed && (
        <p className="text-red-500">Please select no more than {maxImagesAllowed} images.</p>
      )}
    </div>
  );
};

// CollageDisplay: Shows the generated story and prompts
const CollageDisplay: React.FC<CollageDisplayProps> = ({ collageData }) => {
  if (!collageData) {
    return null;
  }
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-xl font-medium mb-3">Your AI Generated Story</h3>
      <div className="prose prose-sm max-w-none">
        <p className="whitespace-pre-wrap">
          {collageData.summary}
        </p>
      </div>
      {collageData.prompts && collageData.prompts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-medium">Journal Prompts:</h4>
          <ul className="list-disc pl-5 mt-2">
            {collageData.prompts.map((prompt, index) => (
              <li key={index} className="mb-1">{prompt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


// --- Main Orchestrator Component ---
const ImageCollageCreator: React.FC = () => {
  // Get media from the store instead of using placeholder data
  const { media, fetchMedia, loading: loadingMediaStore } = useMediaStore();
  
  // Convert Media objects to CollageImage format for images only
  const uploadedImages: CollageImage[] = media
    .filter(item => item.file_type?.startsWith('image/'))
    .map(item => ({
      id: item.id,
      supabaseUrl: constructMediaUrl(item.thumbnail_url || item.file_path),
      fileName: item.file_name,
      taken_at: item.taken_at,
      location: item.location
    }));
  
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [currentCollage, setCurrentCollage] = useState<CollageData | null>(null);
  const [isLoadingCollage, setIsLoadingCollage] = useState<boolean>(false);
  const [showDraggableCollage, setShowDraggableCollage] = useState<boolean>(false);

  const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000'; // Set your API base URL
  const MAX_IMAGES_FOR_COLLAGE = 5; // As per Groq's recommendation

  // --- Image Selection Logic ---
  const handleToggleSelectImage = (imageId: string): void => {
    setSelectedImageIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(imageId)) {
        newSelectedIds.delete(imageId);
      } else {
        newSelectedIds.add(imageId);
      }
      return newSelectedIds;
    });
  };

  // --- API Call Logic ---
  const handleGenerateCollage = async (): Promise<void> => {
    const selectedImagesData = uploadedImages.filter(img => selectedImageIds.has(img.id));

    if (selectedImagesData.length === 0) {
      alert("Please select images to generate a story.");
      return;
    }
    if (selectedImagesData.length > MAX_IMAGES_FOR_COLLAGE) {
      alert(`You can select a maximum of ${MAX_IMAGES_FOR_COLLAGE} images for a story.`);
      return;
    }

    // Prepare payload for the API
    const mediaItemsForApi = selectedImagesData.map(img => ({
      image_url: img.supabaseUrl, // Ensure this key matches your Pydantic model on backend
      file_name: img.fileName,   // Optional
      taken_at: img.taken_at,    // Optional
      location: img.location     // Optional
    }));

    setIsLoadingCollage(true);
    setCurrentCollage(null); 

    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_items: mediaItemsForApi }),
      });

      if (!response.ok) {
        let errorDetail = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
        } catch {
            // Keep default error detail if parsing response as JSON fails
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      setCurrentCollage(data);
    } catch (error) {
      console.error("Error generating collage:", error);
      alert(`Failed to generate story: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingCollage(false);
    }
  };

  // Handle creating a draggable collage
  const handleCreateCollage = (): void => {
    if (selectedImageIds.size === 0) {
      alert("Please select at least one image for your collage.");
      return;
    }
    setShowDraggableCollage(true);
  };

  // Handle saving the layout
  const handleSaveLayout = (layout: Layout[]): void => {
    console.log("Layout saved:", layout);
    // If layout is empty, it means the "Clear All" button was clicked
    if (layout.length === 0) {
      setSelectedImageIds(new Set());
      setShowDraggableCollage(false);
    }
    // Here you could save the layout to a database or state management store
  };

  // useEffect to fetch media when component mounts
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Get selected images
  const selectedImages = uploadedImages.filter(img => selectedImageIds.has(img.id));

  // Show loading state while fetching media
  if (loadingMediaStore && uploadedImages.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">Create Your Moment Collection</h2>
      
      <div className="mb-6">
        <p className="text-gray-600">
          Select up to {MAX_IMAGES_FOR_COLLAGE} images to generate a unique story and journal prompts, 
          or create a custom collage with our drag-and-drop editor.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-medium mb-4">Your Uploaded Images</h3>
        <ImageGrid 
          images={uploadedImages}
          selectedImageIds={selectedImageIds}
          onToggleSelectImage={handleToggleSelectImage}
        />
        
        <SelectedImagesActions 
          selectedImageIds={selectedImageIds}
          onGenerateCollage={handleGenerateCollage}
          isLoading={isLoadingCollage}
          maxImagesAllowed={MAX_IMAGES_FOR_COLLAGE}
          onCreateCollage={handleCreateCollage}
        />
      </div>
      
      {showDraggableCollage && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium">Your Custom Collage</h3>
            <button 
              onClick={() => setShowDraggableCollage(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide Collage Editor
            </button>
          </div>
          <DraggableCollageCreator 
            images={selectedImages}
            onSaveLayout={handleSaveLayout}
          />
        </div>
      )}
      
      {currentCollage && <CollageDisplay collageData={currentCollage} />}
    </div>
  );
};

export default ImageCollageCreator; 