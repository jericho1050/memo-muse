import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, Collection, Media } from '../lib/supabase';
import { useCollectionStore } from '../store/collectionStore';

function CollectionView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, generateAISummary, loading, processing } = useCollectionStore();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  
  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) return;
      
      // Try to find in store first
      const foundCollection = collections.find(c => c.id === id);
      if (foundCollection) {
        setCollection(foundCollection);
      } else {
        // Fetch from database if not in store
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching collection:', error);
          navigate('/gallery');
          return;
        }
        
        setCollection(data as Collection);
      }
      
      // Fetch media items in this collection
      setLoadingMedia(true);
      const { data: mediaCollections, error: mcError } = await supabase
        .from('media_collections')
        .select('media_id')
        .eq('collection_id', id);
        
      if (mcError) {
        console.error('Error fetching media collections:', mcError);
        setLoadingMedia(false);
        return;
      }
      
      if (mediaCollections.length > 0) {
        const mediaIds = mediaCollections.map(mc => mc.media_id);
        
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .in('id', mediaIds);
          
        if (mediaError) {
          console.error('Error fetching media:', mediaError);
        } else {
          setMediaItems(media as Media[]);
        }
      }
      
      setLoadingMedia(false);
    };
    
    fetchCollection();
  }, [id, collections, navigate]);
  
  const handleGenerateAI = () => {
    if (!collection || mediaItems.length === 0) return;
    generateAISummary(collection.id, mediaItems);
  };
  
  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!collection) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-700">Collection not found</h3>
        <button
          onClick={() => navigate('/gallery')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/gallery')}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{collection.title}</h2>
      </div>
      
      {/* Media grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loadingMedia ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
          ))
        ) : mediaItems.length > 0 ? (
          mediaItems.map((item) => (
            <div key={item.id} className="rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-100">
                {item.file_type?.startsWith('image/') ? (
                  <img
                    src={`https://example.com/storage/${item.file_path}`}
                    alt={item.file_name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=Image';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                    <p>Video</p>
                  </div>
                )}
              </div>
              
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">{item.file_name}</p>
                {item.taken_at && (
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Clock size={12} className="mr-1" />
                    {new Date(item.taken_at).toLocaleDateString()}
                  </div>
                )}
                {item.location && item.location !== 'Unknown location' && (
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <MapPin size={12} className="mr-1" />
                    {item.location}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No media in this collection</p>
          </div>
        )}
      </div>
      
      {/* AI summary section */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">AI Story Summary</h3>
          {!collection.ai_summary && (
            <button
              onClick={handleGenerateAI}
              disabled={processing || mediaItems.length === 0}
              className={`px-4 py-2 rounded-md ${
                processing || mediaItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {processing ? 'Generating...' : 'Generate Story'}
            </button>
          )}
        </div>
        
        {processing ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
          </div>
        ) : collection.ai_summary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-indigo max-w-none"
          >
            <p className="text-gray-700 leading-relaxed">{collection.ai_summary}</p>
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Generate an AI-powered story from your memories</p>
          </div>
        )}
        
        {/* Journal prompts */}
        {collection.journal_prompts && collection.journal_prompts.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-700 flex items-center">
              <Bookmark className="w-5 h-5 text-indigo-500 mr-2" />
              Journal Prompts
            </h4>
            <ul className="mt-4 space-y-3">
              {collection.journal_prompts.map((prompt, index) => (
                <li key={index} className="bg-indigo-50 p-4 rounded-md">
                  <p className="text-gray-700">{prompt}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionView;