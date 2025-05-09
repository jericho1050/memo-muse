import { create } from 'zustand';
import { supabase, Media } from '../lib/supabase';

interface MediaState {
  media: Media[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  fetchMedia: () => Promise<void>;
  uploadMedia: (file: File, metadata: Partial<Media>) => Promise<Media | null>;
  deleteMedia: (id: string) => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  media: [],
  loading: false,
  uploading: false,
  error: null,

  fetchMedia: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('taken_at', { ascending: false });
        
      if (error) throw error;
      
      set({ media: data as Media[] });
    } catch (error: any) {
      console.error('Error fetching media:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  uploadMedia: async (file: File, metadata: Partial<Media>) => {
    try {
      set({ uploading: true, error: null });

      // get the current auth user

      const { data: {user}} = await supabase.auth.getUser()
      if (!user) throw new Error('User must be authenticated to upload media');
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `media/${fileName}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      
      // Create media record in database
      const mediaData = {
        user_id: user.id,
        thumbnail_url: publicUrl,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        ...metadata,
      };
      
      const { data, error } = await supabase
        .from('media')
        .insert(mediaData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add to local state
      const newMedia = data as Media;
      set({ media: [newMedia, ...get().media] });
      
      return newMedia;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      set({ error: error.message });
      return null;
    } finally {
      set({ uploading: false });
    }
  },
  
  deleteMedia: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get file path first
      const mediaItem = get().media.find(item => item.id === id);
      if (!mediaItem) throw new Error('Media not found');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([mediaItem.file_path]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      set({ media: get().media.filter(item => item.id !== id) });
    } catch (error: any) {
      console.error('Error deleting media:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));