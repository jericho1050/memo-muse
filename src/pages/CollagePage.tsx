import { useState, useRef } from 'react'
import CollageGrid, { CollageItem } from '../features/collage/CollageGrid'
import ImageCollageCreator from '../components/ImageCollageCreator'
import CollageExporter from '../components/CollageExporter'

function CollagePage() {
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('advanced')
  const [images, setImages] = useState<CollageItem[]>([])
  const simpleCollageRef = useRef<HTMLDivElement>(null);

  const handleAddImages = (files: FileList | null) => {
    if (!files) return
    const newImages: CollageItem[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const resetLayout = () => {
    localStorage.removeItem('collageLayout')
    window.location.reload()
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Collage Creator</h1>
      <p>Drag and resize images to create your collage</p>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('simple')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'simple'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Simple Collage
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Collage Creator
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'simple' ? (
        <div className="space-y-6">
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={e => handleAddImages(e.target.files)}
              className="border p-2 rounded"
            />
            <button 
              onClick={resetLayout} 
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Reset Layout
            </button>
          </div>
          
          {images.length > 0 ? (
            <>
              <CollageGrid images={images} ref={simpleCollageRef} />
              
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Export Your Collage</h3>
                <CollageExporter 
                  targetRef={simpleCollageRef}
                  filename={`simple-collage-${new Date().toISOString().slice(0, 10)}`}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 border rounded-lg">
              <p className="text-gray-500 mb-4">No images added yet</p>
              <p className="text-sm text-gray-400">Upload some images to create your collage</p>
            </div>
          )}
        </div>
      ) : (
        <ImageCollageCreator />
      )}
    </div>
  )
}

export default CollagePage
