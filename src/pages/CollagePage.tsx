import { useState } from 'react'
import CollageGrid, { CollageItem } from '../features/collage/CollageGrid'

function CollagePage() {
  const [images, setImages] = useState<CollageItem[]>([])

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
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <input
          type="file"
          multiple
          onChange={e => handleAddImages(e.target.files)}
          className="border p-2"
        />
        <button onClick={resetLayout} className="px-4 py-2 bg-gray-200 rounded">
          Reset Layout
        </button>
      </div>
      <CollageGrid images={images} />
    </div>
  )
}

export default CollagePage
