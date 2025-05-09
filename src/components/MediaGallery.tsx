import { useState, useEffect } from 'react';
import { Grid, List, Calendar, Trash, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMediaStore } from '../store/mediaStore';
import { useCollectionStore } from '../store/collectionStore';
import { groupMediaByDate } from '../utils/mediaUtils';
import { Media } from '../lib/supabase';

type ViewMode = 'grid' | 'timeline';

function MediaGallery() {
  const { media, loading, fetchMedia, deleteMedia } = useMediaStore();
  const { createCollection } = useCollectionStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupedMedia, setGroupedMedia] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);
  
  useEffect(() => {
    if (media.length > 0) {
      const grouped = groupMediaByDate(media);
      setGroupedMedia(grouped);
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
    if (selectedItems.length === 0) return;
    
    setIsCreatingCollection(true);
    try {
      const collectionName = prompt('Enter a name for this collection:');
      if (!collectionName) {
        setIsCreatingCollection(false);
        return;
      }
      
      await createCollection(collectionName, selectedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setIsCreatingCollection(false);
    }
  };
  
  if (loading && media.length === 0) {
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleCreateCollection}
              disabled={isCreatingCollection}
              className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Create Collection
            </button>
          </div>
        )}
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item: Media) => (
            <MediaGridItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={() => toggleItemSelection(item.id)}
              onDelete={() => deleteMedia(item.id)}
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
                {group.items.map((item: Media) => (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                    onDelete={() => deleteMedia(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MediaGridItemProps {
  item: Media;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function MediaGridItem({ item, isSelected, onSelect, onDelete }: MediaGridItemProps) {
  const isImage = item.file_type?.startsWith('image/');

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
            src={item.thumbnail_url}
            alt={item.file_name}
            className="object-cover w-full h-full"
            // Placeholder until real image loads
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Image';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Film className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40">
        <button
          onClick={onDelete}
          className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
          title="Delete media"
        >
          <Trash size={16} />
        </button>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate">
          {item.file_name}
        </p>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}

function Check(props: React.ComponentProps<typeof motion.svg>) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </motion.svg>
  );
}

export default MediaGallery;