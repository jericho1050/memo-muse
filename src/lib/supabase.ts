import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  avatar_url?: string;
  name?: string;
};

export type Media = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  taken_at?: string;
  location?: string;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
};

export type Collection = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  ai_summary?: string;
  journal_prompts?: string[];
  created_at: string;
  updated_at: string;
};

export type MediaCollection = {
  id: string;
  media_id: string;
  collection_id: string;
};

export interface Tag {
id: string;
user_id: string;
name: string;
created_at: string;
updated_at: string;
}

export interface MediaTag {
id: string;
media_id: string;
tag_id: string;
}
