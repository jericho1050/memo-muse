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

interface DraggableCollageCreatorProps {
  images: CollageImage[];
  onSaveLayout?: (layout: Layout[]) => void;
}

function DraggableCollageCreator({ images, onSaveLayout }: DraggableCollageCreatorProps) {
  // State for layouts at different breakpoints
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    // Try to load from localStorage first
    const savedLayouts = localStorage.getItem('collageLayout');
    if (savedLayouts) {
      try {
        return JSON.parse(savedLayouts);
      } catch (e) {
        console.error('Failed to parse saved layout', e);
      }
    }
    
    // Default layout if no saved layout exists
    return generateDefaultLayout(images);
  });

  // Ref for the collage container element (for export)
  const collageRef = useRef<HTMLDivElement>(null);
  
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
    if (images.length > 0) {
      // Check if all images in the current layout still exist
      const currentImageIds = new Set(images.map(img => img.id));
      const existingLayoutIds = new Set();
      
      // Collect all layout IDs
      Object.values(layouts).forEach(breakpointLayouts => {
        breakpointLayouts.forEach(layout => {
          existingLayoutIds.add(layout.i);
        });
      });
      
      // If there are new images or removed images, regenerate the layout
      const needsUpdate = images.some(img => !existingLayoutIds.has(img.id)) || 
                         Array.from(existingLayoutIds).some(id => !currentImageIds.has(id as string));
      
      if (needsUpdate) {
        setLayouts(generateDefaultLayout(images));
      }
    }
  }, [images]);

  // Save layout to localStorage when it changes
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
    localStorage.setItem('collageLayout', JSON.stringify(allLayouts));
    
    if (onSaveLayout) {
      onSaveLayout(currentLayout);
    }
  };

  // Reset the layout to default
  const handleResetLayout = () => {
    const newLayouts = generateDefaultLayout(images);
    setLayouts(newLayouts);
    localStorage.setItem('collageLayout', JSON.stringify(newLayouts));
  };

  // Clear the entire layout
  const handleClearLayout = () => {
    localStorage.removeItem('collageLayout');
    setLayouts(generateDefaultLayout([]));
  };

  if (!images || images.length === 0) {
    return <p className="text-center py-10">No images available for collage. Please select some images first.</p>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium export-hide">Drag and resize images to create your collage</h3>
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
        >
          {images.map((image) => (
            <div key={image.id} className="relative">
              <img 
                src={image.supabaseUrl} 
                alt={image.fileName || 'Collage image'} 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 border-2 border-gray-200 export-hide" />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
      
      <div className="mt-6 border-t pt-4 export-hide">
        <h3 className="text-lg font-medium mb-4">Export Your Collage</h3>
        <CollageExporter 
          targetRef={collageRef}
          filename={`collage-${new Date().toISOString().slice(0, 10)}`}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-500 export-hide">
        <p>Tip: Drag images to reposition, and resize from the corners.</p>
      </div>
    </div>
  );
}

export default DraggableCollageCreator; 