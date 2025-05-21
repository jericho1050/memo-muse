import { create } from 'zustand';
import { supabase, Collection, Media } from '../lib/supabase';

interface CollectionState {
  collections: Collection[];
  loading: boolean;
  processing: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  createCollection: (title: string, mediaIds: string[]) => Promise<Collection | null>;
  generateAISummary: (collectionId: string, mediaItems: Media[]) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
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
      
      set({ collections: data as Collection[] });
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      set({ error: error.message });
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
      
      // This would call your FastAPI backend
      const response = await fetch(import.meta.env.VITE_FASTAPI_URL);
      
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
}));