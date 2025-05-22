import { create } from 'zustand';
import { supabase, Collection, Media } from '../lib/supabase';
import { constructMediaUrl } from '../utils/mediaUtils';

interface CollectionState {
  collections: Collection[];
  collectionMedia: Record<string, Media[]>;
  loading: boolean;
  processing: boolean;
  error: string | null;
  fetchCollections: () => Promise<Collection[]>;
  fetchCollectionMedia: (collectionId: string) => Promise<Media[]>;
  createCollection: (title: string, mediaIds: string[]) => Promise<Collection | null>;
  generateAISummary: (collectionId: string, mediaItems: Media[]) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, data: Partial<Collection>) => Promise<void>;
  addMediaToCollection: (collectionId: string, mediaIds: string[]) => Promise<void>;
  removeMediaFromCollection: (collectionId: string, mediaIds: string[]) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  collectionMedia: {},
  loading: false,
  processing: false,
  error: null,

  fetchCollections: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const collections = data as Collection[];
      set({ collections });
      return collections;
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      set({ error: error.message });
      return [];
    } finally {
      set({ loading: false });
    }
  },
  
  createCollection: async (title: string, mediaIds: string[]) => {
   const {data: { user }}  = await supabase.auth.getUser()
    try {

      set({ loading: true, error: null });
      
      // Create collection
      const { data, error } = await supabase
        .from('collections')
        .insert({ title, user_id: user?.id })
        .select()
        .single();
        
      if (error) throw error;
      
      const collection = data as Collection;
      
      // Link media to collection
      const mediaCollections = mediaIds.map(mediaId => ({
        media_id: mediaId,
        collection_id: collection.id
      }));
      
      const { error: linkError } = await supabase
        .from('media_collections')
        .insert(mediaCollections);
        
      if (linkError) throw linkError;
      
      // Update local state
      set({ collections: [collection, ...get().collections] });
      
      return collection;
    } catch (error: any) {
      console.error('Error creating collection:', error);
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  generateAISummary: async (collectionId: string, mediaItems: Media[]) => {
    try {
      set({ processing: true, error: null });
      
      // Prepare the media items for the API
      const mediaItemsForApi = mediaItems.map(img => {
        // Use the constructMediaUrl utility function
        const imageUrl = constructMediaUrl(img.thumbnail_url || img.file_path);
        
        return {
          image_url: imageUrl,
          file_name: img.file_name,
          taken_at: img.taken_at,
          location: img.location
        };
      });
      
      // Call the FastAPI backend
      const response = await fetch(`${import.meta.env.VITE_FASTAPI_URL}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ media_items: mediaItemsForApi }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate AI summary');
      }
      
      const data = await response.json();
      
      // Update collection with AI summary
      const { error } = await supabase
        .from('collections')
        .update({
          ai_summary: data.summary,
          journal_prompts: data.prompts,
        })
        .eq('id', collectionId);
        
      if (error) throw error;
      
      // Update local state
      set({
        collections: get().collections.map(c => 
          c.id === collectionId
            ? { ...c, ai_summary: data.summary, journal_prompts: data.prompts }
            : c
        ),
      });
      
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      set({ error: error.message });
    } finally {
      set({ processing: false });
    }
  },
  
  deleteCollection: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // Delete from database
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      set({ collections: get().collections.filter(c => c.id !== id) });
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateCollection: async (id: string, data: Partial<Collection>) => {
    try {
      set({ loading: true, error: null });
      
      // Update in database
      const { error } = await supabase
        .from('collections')
        .update(data)
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      set({
        collections: get().collections.map(c => 
          c.id === id ? { ...c, ...data } : c
        ),
      });
    } catch (error: any) {
      console.error('Error updating collection:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  addMediaToCollection: async (collectionId: string, mediaIds: string[]) => {
    try {
      set({ loading: true, error: null });
      
      // Create media-collection relationships
      const mediaCollections = mediaIds.map(mediaId => ({
        media_id: mediaId,
        collection_id: collectionId
      }));
      
      const { error } = await supabase
        .from('media_collections')
        .insert(mediaCollections);
        
      if (error) throw error;
      
      // No need to update local state as the collection view will refresh
    } catch (error: any) {
      console.error('Error adding media to collection:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  removeMediaFromCollection: async (collectionId: string, mediaIds: string[]) => {
    try {
      set({ loading: true, error: null });
      
      // Delete media-collection relationships
      const { error } = await supabase
        .from('media_collections')
        .delete()
        .eq('collection_id', collectionId)
        .in('media_id', mediaIds);
        
      if (error) throw error;
      
      // No need to update local state as the collection view will refresh
    } catch (error: any) {
      console.error('Error removing media from collection:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCollectionMedia: async (collectionId: string) => {
    try {
      // If we already have media for this collection, return it
      if (get().collectionMedia[collectionId]?.length > 0) {
        return get().collectionMedia[collectionId];
      }
      
      // Fetch media items in this collection
      const { data: mediaCollections, error: mcError } = await supabase
        .from('media_collections')
        .select('media_id')
        .eq('collection_id', collectionId);
        
      if (mcError) {
        console.error('Error fetching media collections:', mcError);
        return [];
      }
      
      if (mediaCollections.length === 0) {
        // Update cache with empty array
        set(state => ({
          collectionMedia: {
            ...state.collectionMedia,
            [collectionId]: []
          }
        }));
        return [];
      }
      
      const mediaIds = mediaCollections.map(mc => mc.media_id);
      
      const { data: mediaItems, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .in('id', mediaIds);
        
      if (mediaError) {
        console.error('Error fetching media:', mediaError);
        return [];
      }
      
      // Update the cache
      set(state => ({
        collectionMedia: {
          ...state.collectionMedia,
          [collectionId]: mediaItems as Media[]
        }
      }));
      
      return mediaItems as Media[];
    } catch (error) {
      console.error('Error fetching collection media:', error);
      return [];
    }
  },
}));