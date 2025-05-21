import React, { useState, useEffect } from 'react';

// --- Helper/Child Component Stubs (You'll need to create these) ---

// ImageGrid: Displays images and handles selection
// Props: images, selectedImageIds, onToggleSelectImage
const ImageGrid = ({ images, selectedImageIds, onToggleSelectImage }) => {
  if (!images || images.length === 0) {
    return <p>No images uploaded yet. Upload some images to get started!</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
      {images.map((image) => (
        <div 
          key={image.id} 
          onClick={() => onToggleSelectImage(image.id)}
          style={{ 
            border: selectedImageIds.has(image.id) ? '2px solid blue' : '2px solid transparent',
            padding: '5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <img src={image.supabaseUrl} alt={image.fileName || 'Uploaded image'} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
          <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{image.fileName || image.id}</p>
        </div>
      ))}
    </div>
  );
};

// SelectedImagesActions: Button to generate collage for selected items
// Props: selectedImageIds, onGenerateCollage, isLoading, maxImagesAllowed
const SelectedImagesActions = ({ selectedImageIds, onGenerateCollage, isLoading, maxImagesAllowed }) => {
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
    <div style={{ margin: '20px 0' }}>
      <p>{selectedCount} image(s) selected.</p>
      <button onClick={handleGenerateClick} disabled={isLoading || selectedCount === 0}>
        {isLoading ? 'Generating Story...' : 'Generate Story for Selected Images'}
      </button>
      {selectedCount > maxImagesAllowed && (
        <p style={{ color: 'red' }}>Please select no more than {maxImagesAllowed} images.</p>
      )}
    </div>
  );
};

// CollageDisplay: Shows the generated story and prompts
// Props: collageData
const CollageDisplay = ({ collageData }) => {
  if (!collageData) {
    return null;
  }
  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
      <h3>Your AI Generated Story</h3>
      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily:'inherit', fontSize: '1em' }}>
        {collageData.summary}
      </pre>
      {collageData.prompts && collageData.prompts.length > 0 && (
        <>
          <h4>Journal Prompts:</h4>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            {collageData.prompts.map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};


// --- Main Orchestrator Component ---
function ImageCollageCreator() {
  // State for all uploaded images (e.g., fetched from Supabase or managed after upload)
  // Replace with your actual image fetching/management logic
  const [uploadedImages, setUploadedImages] = useState([
    // Example initial data - replace this with your actual image data source
    // { id: '1', supabaseUrl: 'https://placekitten.com/200/150', fileName: 'kitten1.jpg', taken_at: '2023-01-01', location: 'Home' },
    // { id: '2', supabaseUrl: 'https://placekitten.com/200/151', fileName: 'kitten2.jpg', taken_at: '2023-01-02', location: 'Garden' },
    // { id: '3', supabaseUrl: 'https://placekitten.com/200/152', fileName: 'kitten3.jpg', taken_at: '2023-01-03', location: 'Park' },
    // { id: '4', supabaseUrl: 'https://placekitten.com/200/153', fileName: 'kitten4.jpg' },
    // { id: '5', supabaseUrl: 'https://placekitten.com/200/154', fileName: 'kitten5.jpg' },
    // { id: '6', supabaseUrl: 'https://placekitten.com/200/155', fileName: 'kitten6.jpg' },
  ]);
  
  const [selectedImageIds, setSelectedImageIds] = useState(new Set());
  const [currentCollage, setCurrentCollage] = useState(null);
  const [isLoadingCollage, setIsLoadingCollage] = useState(false);

  const FASTAPI_BASE_URL = process.env.REACT_APP_FASTAPI_URL || 'http://localhost:8000'; // Set your API base URL
  const MAX_IMAGES_FOR_COLLAGE = 5; // As per Groq's recommendation

  // --- Image Selection Logic ---
  const handleToggleSelectImage = (imageId) => {
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
  const handleGenerateCollage = async () => {
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
        } catch (e) {
            // Keep default error detail if parsing response as JSON fails
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      setCurrentCollage(data);
    } catch (error) {
      console.error("Error generating collage:", error);
      alert(`Failed to generate story: ${error.message}`);
    } finally {
      setIsLoadingCollage(false);
    }
  };

  // useEffect to fetch/load your uploadedImages from Supabase or other source
  useEffect(() => {
    // TODO: Replace this with your actual logic to fetch images
    // For example, if you have a function getImagesFromSupabase():
    // const fetchImages = async () => {
    //   const images = await getImagesFromSupabase(); // Your function to get image list
    //   setUploadedImages(images);
    // };
    // fetchImages();
    console.log("ImageCollageCreator mounted. You would typically fetch your uploaded images here.");
    // For now, using placeholder data if you uncomment it above or provide your own.
    if (uploadedImages.length === 0) {
        console.warn("No initial images loaded. Please ensure uploadedImages state is populated.");
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div style={{ padding: '20px' }}>
      <h2>Create Your AI Moment Collage</h2>
      
      <p>Select up to {MAX_IMAGES_FOR_COLLAGE} images from your uploaded media to generate a unique story and journal prompts.</p>

      {/* You might have an upload component here or manage uploads elsewhere */}
      
      <h3>Your Uploaded Images:</h3>
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
      />
      
      <CollageDisplay collageData={currentCollage} />
    </div>
  );
}

export default ImageCollageCreator; 