import { supabase } from './supabaseClient';
import { compressAndUpload, deleteUploadedImage } from './imageUpload';

export const LIBRARY_CATEGORIES = ['General', 'Cover', 'Door', 'Closet', 'Villa'];

export async function listLibraryImages(category = null) {
  let query = supabase
    .from('image_library')
    .select('id, label, category, url, created_at')
    .order('created_at', { ascending: false });
  if (category && category !== 'All') {
    query = query.eq('category', category.toLowerCase());
  }
  const { data, error } = await query;
  if (error) throw new Error(`Could not load image library: ${error.message}`);
  return data;
}

export async function addLibraryImage({ file, label, category }) {
  const url = await compressAndUpload(file, 'image-library', category?.toLowerCase() || 'general');
  const { data, error } = await supabase
    .from('image_library')
    .insert({ label: label || '', category: (category || 'General').toLowerCase(), url })
    .select()
    .single();
  if (error) throw new Error(`Could not save to library: ${error.message}`);
  return data;
}

export async function deleteLibraryImage(id, url) {
  const { error } = await supabase.from('image_library').delete().eq('id', id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
  await deleteUploadedImage(url, 'image-library');
}
