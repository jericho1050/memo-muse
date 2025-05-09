import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MediaGallery from '../components/MediaGallery';
import { useMediaStore } from '../store/mediaStore';
import { useCollectionStore } from '../store/collectionStore';

function GalleryPage() {
  const { fetchMedia, media } = useMediaStore();
  const { fetchCollections, collections } = useCollectionStore();
  const [activeTab, setActiveTab] = useState<'media' | 'collections'>('media');
  
  useEffect(() => {
    fetchMedia();
    fetchCollections();
  }, [fetchMedia, fetchCollections]);

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
        <MediaGallery />
      ) : (
        <CollectionsGrid collections={collections} />
      )}
    </div>
  );
}

function CollectionsGrid({ collections }: { collections: any[] }) {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FolderIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700">No collections yet</h3>
        <p className="text-gray-500 mt-1">Create collections from your uploaded media</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <motion.div
          key={collection.id}
          whileHover={{ y: -5 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <Link to={`/collections/${collection.id}`}>
            <div className="aspect-video bg-gray-100 relative">
              {/* This would be a preview image in a real app */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FolderIcon className="w-12 h-12 text-gray-300" />
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800 truncate">{collection.title}</h3>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(collection.created_at).toLocaleDateString()}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {collection.ai_summary ? 'AI summary available' : 'No AI summary yet'}
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default GalleryPage;