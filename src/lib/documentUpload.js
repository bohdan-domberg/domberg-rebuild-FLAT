import { supabase } from './supabaseClient';

/**
 * Uploads a raw file (PDF shop drawings etc.) to the `quote-documents`
 * Storage bucket, unmodified — unlike imageUpload.js this does no
 * compression/re-encoding, since the whole point is preserving the
 * original PDF's real pages for a later pdf-lib merge.
 */
export async function uploadDocument(file, pathPrefix) {
  if (!file) throw new Error('No file provided');

  const safePrefix = String(pathPrefix || 'misc').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeName = String(file.name || 'document.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const filename = `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('quote-documents')
    .upload(filename, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || 'application/pdf',
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('quote-documents').getPublicUrl(filename);
  return data.publicUrl;
}

/** Best-effort delete — a dangling file just sits unused rather than breaking anything. */
export async function deleteUploadedDocument(publicUrl) {
  if (!publicUrl) return;
  try {
    const marker = '/storage/v1/object/public/quote-documents/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from('quote-documents').remove([path]);
  } catch {
    // best-effort, ignore
  }
}
