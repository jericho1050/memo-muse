import { useState, useEffect, forwardRef } from 'react'
import type { Layout, Layouts } from 'react-grid-layout'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export interface CollageItem {
  id: string
  url: string
}

const ResponsiveGridLayout = WidthProvider(Responsive)

interface CollageGridProps {
  images: CollageItem[]
  onLayoutChange?: (layouts: Layouts) => void
}

const CollageGrid = forwardRef<HTMLDivElement, CollageGridProps>(
  ({ images, onLayoutChange }, ref) => {
    const [layouts, setLayouts] = useState<Layouts>(() => {
      const saved = localStorage.getItem('collageLayout')
      return saved ? JSON.parse(saved) : { lg: [] }
    })

    useEffect(() => {
      localStorage.setItem('collageLayout', JSON.stringify(layouts))
      if (onLayoutChange) onLayoutChange(layouts)
    }, [layouts, onLayoutChange])

    const handleLayoutChange = (_: Layout[], all: Layouts) => {
      setLayouts(all)
    }

    const initialLayout = images.map((img, index) => ({
      i: img.id,
      x: (index % 4) * 3,
      y: Math.floor(index / 4) * 3,
      w: 3,
      h: 3,
    }))

    return (
      <div ref={ref} className="border rounded-lg p-2 bg-gray-50">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layouts.lg?.length ? layouts.lg : initialLayout }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={30}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".handle"
        >
          {images.map(img => (
            <div key={img.id} className="border handle rounded overflow-hidden">
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    )
  }
)

CollageGrid.displayName = 'CollageGrid'

export default CollageGrid
