import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../styles/collage.css';
import CollageExporter from './CollageExporter';

// Width provider enhances the ResponsiveGridLayout with automatic width calculation
const ResponsiveGridLayout = WidthProvider(Responsive);

// Define TypeScript interfaces
interface CollageImage {
  id: string;
  supabaseUrl: string;
  fileName?: string;
  taken_at?: string;
  location?: string;
}

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface ImageScale {
  [imageId: string]: number;
}

interface ImagePosition {
  [imageId: string]: { x: number; y: number };
}

interface ImageInteractionModes {
  [imageId: string]: 'move' | 'scale';
}

interface ScaleControlsProps {
  imageId: string;
  scale: number;
  mode: 'move' | 'scale';
  onScaleChange: (imageId: string, scale: number) => void;
  onModeToggle: () => void;
  isScaling: boolean;
}

interface DraggableCollageCreatorProps {
  images: CollageImage[];
  onSaveLayout?: (layout: Layout[]) => void;
}

// Scale Controls Component
const ScaleControls: React.FC<ScaleControlsProps> = ({ 
  imageId, 
  scale, 
  mode, 
  onScaleChange, 
  onModeToggle,
  isScaling 
}) => {
  const handleScaleChange = (newScale: number) => {
    const clampedScale = Math.max(0.5, Math.min(3, newScale));
    onScaleChange(imageId, clampedScale);
  };

  // Stop propagation to prevent grid item interaction when clicking controls
  const handleMouseDownOnControls = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="absolute top-1 left-1 bg-white bg-opacity-95 rounded-md p-2 flex flex-col space-y-1 export-hide z-20 shadow-lg scale-controls"
      onMouseDown={handleMouseDownOnControls}
    >
      {/* Mode Toggle */}
      <div className="flex items-center space-x-1 mb-1">
        <button
          onClick={onModeToggle}
          className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
            mode === 'move' 
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-green-500 text-white shadow-sm'
          }`}
          title={mode === 'move' ? 'Switch to Scale Mode' : 'Switch to Move Mode'}
        >
          {mode === 'move' ? '↔️' : '🔍'}
        </button>
        <span className={`text-xs font-medium ${
          mode === 'move' ? 'text-blue-600' : 'text-green-600'
        } ${isScaling ? 'mode-indicator' : ''}`}>
          {mode === 'move' ? 'Move' : 'Scale'}
        </span>
      </div>
      
      {/* Scale Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleScaleChange(scale - 0.1)}
          className="w-6 h-6 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
          title="Zoom out"
        >
          −
        </button>
        <span className="text-xs font-mono w-10 text-center bg-gray-50 rounded px-1">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => handleScaleChange(scale + 0.1)}
          className="w-6 h-6 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => handleScaleChange(1)}
          className="w-6 h-6 text-xs bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center"
          title="Reset scale"
        >
          ⌂
        </button>
      </div>
      
      {/* Scale Status */}
      {isScaling && (
        <div className="text-xs text-center text-blue-600 font-medium bg-blue-50 rounded px-2 py-1">
          🎯 Panning...
        </div>
      )}
    </div>
  );
};

function DraggableCollageCreator({ images, onSaveLayout }: DraggableCollageCreatorProps) {
  // Initialize imageModes first
  const [imageModes, setImageModes] = useState<ImageInteractionModes>(() => {
    const savedModes = localStorage.getItem('collageImageModes');
    if (savedModes) {
      try {
        return JSON.parse(savedModes);
      } catch (e) {
        console.error('Failed to parse saved image modes', e);
      }
    }
    const modes: ImageInteractionModes = {};
    images.forEach(image => { // Ensure images is available or handle its async loading if necessary
      modes[image.id] = 'move';
    });
    return modes;
  });

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    let loadedLayouts = null;
    const savedLayoutsString = localStorage.getItem('collageLayout');
    if (savedLayoutsString) {
      try {
        loadedLayouts = JSON.parse(savedLayoutsString);
      } catch (e) {
        console.error('Failed to parse saved layouts', e);
        loadedLayouts = null; // Fallback to default if parsing fails
      }
    }

    const initialLayouts = loadedLayouts || generateDefaultLayout(images);

    // Sync initial layouts with imageModes for the 'static' property
    Object.keys(initialLayouts).forEach(breakpoint => {
      if (Array.isArray(initialLayouts[breakpoint])) {
        initialLayouts[breakpoint] = initialLayouts[breakpoint].map((item: Layout) => ({
          ...item,
          static: (imageModes[item.i] || 'move') === 'scale',
        }));
      } else { // Ensure all breakpoints have an array
        initialLayouts[breakpoint] = [];
      }
    });
    return initialLayouts;
  });

  const [imageScales, setImageScales] = useState<ImageScale>(() => {
    const savedScales = localStorage.getItem('collageImageScales');
    if (savedScales) {
      try {
        return JSON.parse(savedScales);
      } catch (e) {
        console.error('Failed to parse saved scales', e);
      }
    }
    
    // Default scale of 1.0 for all images
    const scales: ImageScale = {};
    images.forEach(image => {
      scales[image.id] = 1.0;
    });
    return scales;
  });

  const [imagePositions, setImagePositions] = useState<ImagePosition>(() => {
    const savedPositions = localStorage.getItem('collageImagePositions');
    if (savedPositions) {
      try {
        return JSON.parse(savedPositions);
      } catch (e) {
        console.error('Failed to parse saved positions', e);
      }
    }
    const positions: ImagePosition = {};
    images.forEach(image => {
      positions[image.id] = { x: 50, y: 50 }; // Default center position (percentage)
    });
    return positions;
  });

  // Pan offsets for each image (x, y in pixels, not percentage)
  const [imagePanOffsets, setImagePanOffsets] = useState<{[imageId: string]: {x: number, y: number}}>(() => {
    const savedOffsets = localStorage.getItem('collagePanOffsets');
    if (savedOffsets) {
      try {
        return JSON.parse(savedOffsets);
      } catch (e) {
        console.error('Failed to parse saved pan offsets', e);
        return {};
      }
    }
    return {};
  });

  // Refs for direct DOM manipulation during panning
  const imagePanningRef = useRef<{
    isPanning: boolean;
    imageId: string | null;
    startX: number;
    startY: number;
    lastOffsetX: number;
    lastOffsetY: number;
  }>({
    isPanning: false,
    imageId: null,
    startX: 0,
    startY: 0,
    lastOffsetX: 0,
    lastOffsetY: 0,
  });

  // Additional ref for the container elements of each image
  const imageContainersRef = useRef<{[imageId: string]: HTMLDivElement | null}>({});

  // Ref for the collage container element (for export)
  const collageRef = useRef<HTMLDivElement>(null);

  // Handle scale changes for individual images
  const handleScaleChange = (imageId: string, scale: number) => {
    console.log(`Scaling image ${imageId} to ${scale}`);
    setImageScales(prev => {
      const newScales = { ...prev, [imageId]: scale };
      localStorage.setItem('collageImageScales', JSON.stringify(newScales));
      return newScales;
    });
    
    // Apply the scale directly to maintain the current position
    const imageContainer = imageContainersRef.current[imageId];
    if (imageContainer) {
      const img = imageContainer.querySelector('img');
      if (img) {
        const panOffset = imagePanOffsets[imageId] || { x: 0, y: 0 };
        img.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`;
      }
    }
  };

  // Handle position changes for individual images (panning)
  const handlePositionChange = (imageId: string, x: number, y: number) => {
    console.log(`handlePositionChange called for ${imageId}: x=${x}, y=${y}`);
    setImagePositions(prev => {
      const newPositions = { ...prev, [imageId]: { x, y } };
      localStorage.setItem('collageImagePositions', JSON.stringify(newPositions));
      return newPositions;
    });
  };

  // Toggle interaction mode for a specific image
  const handleModeToggle = (imageId: string) => {
    let newImageMode: 'move' | 'scale' = 'move'; // Variable to capture the new mode

    setImageModes(prev => {
      const currentMode = prev[imageId] || 'move';
      newImageMode = currentMode === 'move' ? 'scale' : 'move';
      const newModes = { ...prev, [imageId]: newImageMode };
      localStorage.setItem('collageImageModes', JSON.stringify(newModes));
      return newModes;
    });

    // Update the 'static' property in the layouts state
    setLayouts(prevLayouts => {
      const updatedLayouts = { ...prevLayouts };
      Object.keys(updatedLayouts).forEach(breakpoint => {
        if (Array.isArray(updatedLayouts[breakpoint])) {
          updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(item => {
            if (item.i === imageId) {
              return { ...item, static: newImageMode === 'scale' };
            }
            return item;
          });
        }
      });
      // Persist updated layouts with new static flags
      localStorage.setItem('collageLayout', JSON.stringify(updatedLayouts));
      return updatedLayouts;
    });
    
    if (imagePanningRef.current.isPanning && imagePanningRef.current.imageId === imageId) {
      imagePanningRef.current = {
        isPanning: false,
        imageId: null,
        startX: 0,
        startY: 0,
        lastOffsetX: 0,
        lastOffsetY: 0
      };
    }
  };

  // Completely revamped panning handler functions
  const startPanning = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Critical: Prevent event from bubbling to react-grid-layout
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    console.log(`Starting pan for image ${imageId}`);
    
    const currentOffsets = imagePanOffsets[imageId] || { x: 0, y: 0 };
    
    // Set the ref data for panning
    imagePanningRef.current = {
      isPanning: true,
      imageId,
      startX: e.clientX,
      startY: e.clientY,
      lastOffsetX: currentOffsets.x,
      lastOffsetY: currentOffsets.y
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handlePanMove);
    document.addEventListener('mouseup', endPanning);
  };
  
  const handlePanMove = (e: MouseEvent) => {
    if (!imagePanningRef.current.isPanning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const { imageId, startX, startY, lastOffsetX, lastOffsetY } = imagePanningRef.current;
    if (!imageId) return;
    
    // Calculate new offsets
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Apply more sensitivity for precise control (adjust multiplier as needed)
    const newOffsetX = lastOffsetX + deltaX;
    const newOffsetY = lastOffsetY + deltaY;
    
    console.log(`Panning image ${imageId}: offsetX=${newOffsetX}, offsetY=${newOffsetY}`);
    
    // Apply the transform directly to the DOM element for immediate feedback
    const imageContainer = imageContainersRef.current[imageId];
    if (imageContainer) {
      const img = imageContainer.querySelector('img');
      if (img) {
        img.style.transform = `translate(${newOffsetX}px, ${newOffsetY}px) scale(${imageScales[imageId] || 1})`;
      }
    }
  };
  
  const endPanning = (e: MouseEvent) => {
    if (!imagePanningRef.current.isPanning) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const { imageId, startX, startY, lastOffsetX, lastOffsetY } = imagePanningRef.current;
    if (!imageId) return;
    
    // Calculate final offsets
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newOffsetX = lastOffsetX + deltaX;
    const newOffsetY = lastOffsetY + deltaY;
    
    console.log(`Ending pan for image ${imageId}: final offsetX=${newOffsetX}, offsetY=${newOffsetY}`);
    
    // Update state 
    setImagePanOffsets(prev => {
      const newOffsets = {
        ...prev,
        [imageId]: { x: newOffsetX, y: newOffsetY }
      };
      localStorage.setItem('collagePanOffsets', JSON.stringify(newOffsets));
      return newOffsets;
    });
    
    // Clean up
    imagePanningRef.current = {
      isPanning: false,
      imageId: null,
      startX: 0,
      startY: 0,
      lastOffsetX: 0,
      lastOffsetY: 0
    };
    
    // Remove global listeners
    document.removeEventListener('mousemove', handlePanMove);
    document.removeEventListener('mouseup', endPanning);
  };

  // Generate a default layout for the images
  function generateDefaultLayout(images: CollageImage[]): { [key: string]: Layout[] } {
    // Create a basic grid layout: 2 columns for small screens, 3 for medium, 4 for large
    const layouts: { [key: string]: Layout[] } = {
      lg: [],
      md: [],
      sm: [],
    };
    
    // Position each image in the grid
    images.forEach((image, index) => {
      // For large screens: 4 columns
      layouts.lg.push({
        i: image.id,
        x: index % 4,
        y: Math.floor(index / 4),
        w: 1,
        h: 1,
        minW: 1,
        minH: 1,
      });
      
      // For medium screens: 3 columns
      layouts.md.push({
        i: image.id,
        x: index % 3,
        y: Math.floor(index / 3),
        w: 1,
        h: 1,
        minW: 1,
        minH: 1,
      });
      
      // For small screens: 2 columns
      layouts.sm.push({
        i: image.id,
        x: index % 2,
        y: Math.floor(index / 2),
        w: 1,
        h: 1,
        minW: 1,
        minH: 1,
      });
    });
    
    return layouts;
  }

  // Update layouts when images change
  useEffect(() => {
    // Update layouts when images prop changes (e.g., new images added)
    // This ensures new images get a layout and existing ones maintain their mode.
    if (images.length > 0 || Object.keys(layouts.lg || {}).length > 0 ) { // Process if there are images or existing layouts
        setLayouts(prevLayouts => {
            const newBaseLayouts = generateDefaultLayout(images); // Get fresh grid structure
            const mergedLayouts: { [key: string]: Layout[] } = {};

            Object.keys(newBaseLayouts).forEach(breakpoint => {
                mergedLayouts[breakpoint] = newBaseLayouts[breakpoint].map(newItem => {
                    const existingItem = prevLayouts[breakpoint]?.find(oldItem => oldItem.i === newItem.i);
                    return {
                        ...newItem, // Default positions for new items
                        ...(existingItem || {}), // Spread existing layout if available (preserves x,y,w,h)
                        static: (imageModes[newItem.i] || 'move') === 'scale', // Crucially set static based on current mode
                    };
                });
            });
            
            // Ensure all current images have a layout entry, even if not in prevLayouts
            images.forEach(img => {
              Object.keys(mergedLayouts).forEach(bp => {
                if (!mergedLayouts[bp].find(item => item.i === img.id)) {
                  // This case should ideally be handled by generateDefaultLayout providing all current images
                  // If an image is somehow missing, this log helps.
                  console.warn(`Image ${img.id} was missing from generated layout for breakpoint ${bp}`);
                }
              });
            });

            // Prune layout items for images that no longer exist
            const currentImageIds = new Set(images.map(img => img.id));
            Object.keys(mergedLayouts).forEach(breakpoint => {
                mergedLayouts[breakpoint] = mergedLayouts[breakpoint].filter(item => currentImageIds.has(item.i));
            });


            // Only update if there's a structural change or need to sync static props
            // This simple check might not be deep enough, RGL might handle re-renders.
            // if (JSON.stringify(mergedLayouts) !== JSON.stringify(prevLayouts)) {
            localStorage.setItem('collageLayout', JSON.stringify(mergedLayouts));
            return mergedLayouts;
            // }
            // return prevLayouts;
        });

        // Initialize modes for new images (if any)
        setImageModes(prevImageModes => {
            const newModes = { ...prevImageModes };
            let changed = false;
            images.forEach(image => {
                if (!(image.id in newModes)) {
                    newModes[image.id] = 'move';
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('collageImageModes', JSON.stringify(newModes));
            }
            return changed ? newModes : prevImageModes;
        });
    }
  }, [images]); // Rerun when the images array changes

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    const updatedLayouts = { ...allLayouts };
    // Preserve our 'static' property which RGL doesn't know about directly from user interaction
    Object.keys(updatedLayouts).forEach(breakpoint => {
      if (Array.isArray(updatedLayouts[breakpoint])) {
        updatedLayouts[breakpoint] = updatedLayouts[breakpoint].map(item => {
          // Find the corresponding item in the new layout from RGL
          const rglItem = allLayouts[breakpoint]?.find(rglL => rglL.i === item.i);
          return {
            ...(rglItem || item), // Take RGL's x,y,w,h, but ensure our item structure if rglItem is missing
            static: (imageModes[item.i] || 'move') === 'scale', // Crucially, re-apply our static mode
          };
        });
      }
    });

    setLayouts(updatedLayouts);
    localStorage.setItem('collageLayout', JSON.stringify(updatedLayouts));
    
    if (onSaveLayout) {
      // Pass 'currentLayout' which is the specific breakpoint's layout RGL provides,
      // or allLayouts if more appropriate for the parent.
      // Note: currentLayout items won't have our 'static' flag correctly set by RGL.
      onSaveLayout(currentLayout); 
    }
  };

  // Reset the layout to default
  const handleResetLayout = () => {
    const newLayouts = generateDefaultLayout(images);
    setLayouts(newLayouts);
    localStorage.setItem('collageLayout', JSON.stringify(newLayouts));
    
    // Reset all scales to 1.0
    const resetScales: ImageScale = {};
    images.forEach(image => {
      resetScales[image.id] = 1.0;
    });
    setImageScales(resetScales);
    localStorage.setItem('collageImageScales', JSON.stringify(resetScales));

    // Reset all positions to center
    const resetPositions: ImagePosition = {};
    images.forEach(image => {
      resetPositions[image.id] = { x: 50, y: 50 };
    });
    setImagePositions(resetPositions);
    localStorage.setItem('collageImagePositions', JSON.stringify(resetPositions));
    
    // Reset all pan offsets to zero
    const resetPanOffsets: {[imageId: string]: {x: number, y: number}} = {};
    images.forEach(image => {
      resetPanOffsets[image.id] = { x: 0, y: 0 };
    });
    setImagePanOffsets(resetPanOffsets);
    localStorage.setItem('collagePanOffsets', JSON.stringify(resetPanOffsets));
    
    // Reset all image modes to 'move'
    const resetModes: ImageInteractionModes = {};
    images.forEach(image => {
      resetModes[image.id] = 'move';
    });
    setImageModes(resetModes);
    localStorage.setItem('collageImageModes', JSON.stringify(resetModes));
    
    // Apply the reset to the DOM elements immediately
    images.forEach(image => {
      const imageContainer = imageContainersRef.current[image.id];
      if (imageContainer) {
        const img = imageContainer.querySelector('img');
        if (img) {
          img.style.transform = `translate(0px, 0px) scale(1)`;
        }
      }
    });
  };

  // Clear the collage (signal the parent to deselect all images)
  const handleClearLayout = () => {
    // If onSaveLayout is provided, use it to signal to the parent component
    // that all images should be deselected
    if (onSaveLayout) {
      onSaveLayout([]);
    }
    
    // Alternatively, if this component should maintain its own state but just reset it:
    handleResetLayout();
  };

  if (!images || images.length === 0) {
    return <p className="text-center py-10">No images available for collage. Please select some images first.</p>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="export-hide">
          <h3 className="text-lg font-medium">Create your collage with drag, resize & scale controls</h3>
          <p className="text-sm text-gray-600 mt-1">
            Toggle each image between <span className="font-medium">Move</span> mode (for repositioning) and <span className="font-medium">Scale</span> mode (for panning within cell)
          </p>
        </div>
        <div className="space-x-2 export-hide">
          <button 
            onClick={handleResetLayout}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Reset Layout
          </button>
          <button 
            onClick={handleClearLayout}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 mb-6" ref={collageRef}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={150}
          margin={[10, 10]}
          containerPadding={[10, 10]}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          draggableCancel=".scale-controls, .scale-mode img"
          resizeHandles={['se']}
        >
          {images.map((image) => {
            const scale = imageScales[image.id] || 1.0;
            const panOffset = imagePanOffsets[image.id] || { x: 0, y: 0 };
            const imageMode = imageModes[image.id] || 'move';
            
            return (
              <div 
                key={image.id} 
                className={`relative transition-colors duration-200 ${
                  imageMode === 'scale' ? 'scale-mode' : 'move-mode'
                }`}
                style={{ 
                  overflow: imageMode === 'scale' ? 'visible' : 'hidden',
                }}
              >
                <ScaleControls 
                  imageId={image.id}
                  scale={scale}
                  mode={imageMode}
                  onScaleChange={handleScaleChange}
                  onModeToggle={() => handleModeToggle(image.id)}
                  isScaling={imagePanningRef.current.isPanning && imagePanningRef.current.imageId === image.id}
                />
                
                <div 
                  className="w-full h-full img-container"
                  ref={(el) => {
                    // Type-safe ref assignment
                    if (el) {
                      imageContainersRef.current[image.id] = el;
                    }
                  }}
                  onMouseDown={(e) => {
                    if (imageMode === 'scale') {
                      startPanning(e, image.id);
                    }
                  }}
                  style={{
                    cursor: imageMode === 'scale' ? 'grab' : 'default',
                    position: 'relative',
                    touchAction: 'none', // Disable browser handling of touch gestures
                    overflow: imageMode === 'scale' ? 'visible' : 'hidden', // Allow overflow in scale mode
                  }}
                >
                  <img 
                    src={image.supabaseUrl} 
                    alt={image.fileName || 'Collage image'} 
                    className="w-full h-full object-cover"
                    draggable="false"
                    style={{ 
                      transformOrigin: 'center center',
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                      transition: imagePanningRef.current.isPanning && imagePanningRef.current.imageId === image.id ? 
                        'none' : 'transform 0.15s ease-out',
                      position: 'absolute', // Position absolutely within the container
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      userSelect: 'none', // Prevent selection
                      pointerEvents: imageMode === 'scale' ? 'auto' : 'none',
                      willChange: 'transform', // Hint to browser for optimization
                    }}
                  />
                </div>
                
                <div 
                  className={`absolute inset-0 border-2 border-gray-200 export-hide pointer-events-none ${
                    imageMode === 'scale' ? 'opacity-50' : ''
                  }`}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
      
      <div className="mt-6 border-t pt-4 export-hide">
        <h3 className="text-lg font-medium mb-4">Export Your Collage</h3>
        <CollageExporter 
          targetRef={collageRef as React.RefObject<HTMLDivElement>}
          filename={`collage-${new Date().toISOString().slice(0, 10)}`}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-500 export-hide">
        <p><strong>Move Mode:</strong> Drag grid items to reposition, resize from corners. <strong>Scale Mode:</strong> Drag the image to freely position it within its container.</p>
        <p>Use +/- buttons for precise scaling (50% - 300%). Click ⌂ to reset scale to 100%. Toggle each image between modes using the button in the top-left.</p>
      </div>
    </div>
  );
}

export default DraggableCollageCreator;