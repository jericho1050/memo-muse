import { useEffect, useState } from 'react';
import { Plus, Image } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import MediaGallery from '../components/MediaGallery';
import { TagFilter } from '../components/TagFilter';
import { Collection, Media } from '../lib/supabase';
import { useMediaStore } from '../store/mediaStore';
import { useCollectionStore } from '../store/collectionStore';
import { constructMediaUrl } from '../utils/mediaUtils';

function GalleryPage() {
  const [activeTab, setActiveTab] = useState<'media' | 'collections'>('media');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const { fetchMedia } = useMediaStore();
  const { fetchCollections } = useCollectionStore();

  useEffect(() => {
    if (activeTab === 'media') {
      fetchMedia();
    } else {
      setLoadingCollections(true);
      fetchCollections().then((fetchedCollections) => {
        setCollections(fetchedCollections);
        setLoadingCollections(false);
      });
    }
  }, [activeTab, fetchMedia, fetchCollections]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Gallery</h1>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Upload
        </Link>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('media')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'media'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'collections'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Collections
          </button>
        </nav>
      </div>
      
      {activeTab === 'media' ? (
        <>
          <TagFilter />
          <MediaGallery />
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Collections</h2>
            <button 
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              onClick={() => {
                // You'll need to implement collection creation functionality
                console.log('Create collection clicked');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>
          {loadingCollections ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <CollectionsGrid collections={collections} />
          )}
        </>
      )}
    </div>
  );
}

// Format date to a more readable format
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function CollectionsGrid({ collections }: { collections: Collection[] }) {
  const navigate = useNavigate();
  
  if (collections.length === 0) {
    return (
      <motion.div
        className="text-center py-16 bg-white rounded-lg shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Image className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No collections yet</h3>
        <p className="text-gray-500 mb-6">Create collections to organize your memories</p>
        <button 
          className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          onClick={() => {
            console.log('Create collection clicked from empty state');
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Create your first collection</span>
        </button>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {collections.map((collection) => (
        <motion.div
          key={collection.id}
          className="group relative aspect-square rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer"
          onClick={() => navigate(`/collections/${collection.id}`)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full h-full bg-gray-100">
            <CollectionThumbnail collectionId={collection.id} />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <h3 className="text-white font-medium text-lg truncate">{collection.title}</h3>
            <p className="text-gray-300 text-sm truncate">
              {formatDate(collection.created_at)}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function CollectionThumbnail({ collectionId }: { collectionId: string }) {
  const { fetchCollectionMedia } = useCollectionStore();
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const mediaItems = await fetchCollectionMedia(collectionId);
      setMediaCount(mediaItems.length);
      setMedia(mediaItems.filter(item => item.file_type?.startsWith('image/')).slice(0, 4));
      setLoading(false);
    };
    
    fetchMedia();
  }, [collectionId, fetchCollectionMedia]);
  
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (media.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Image className="w-12 h-12 text-gray-300" />
      </div>
    );
  }
  
  return (
    <div className="absolute inset-0">
      <div className="grid grid-cols-2 grid-rows-2 gap-1 p-1 w-full h-full">
        {media.map((item, index) => (
          <div 
            key={item.id} 
            className={`bg-gray-200 rounded overflow-hidden ${
              media.length === 1 ? 'col-span-2 row-span-2' : 
              media.length === 2 ? 'col-span-1 row-span-2' : 
              media.length === 3 && index === 0 ? 'col-span-2 row-span-1' : ''
            }`}
          >
            <img 
              src={constructMediaUrl(item.thumbnail_url || item.file_path)} 
              alt={item.file_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Image';
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Media count badge */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
        {mediaCount} item{mediaCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default GalleryPage;