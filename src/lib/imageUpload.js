import imageCompression from 'browser-image-compression';
import { supabase } from './supabaseClient';

/**
 * Compresses an image file in the browser, then uploads it to a Supabase
 * Storage bucket. Returns the public URL to store in quote data.
 *
 * Compression target: ~1600px max dimension, ~300KB target size. This is
 * plenty sharp for both on-screen preview and print-to-PDF, while keeping
 * the free-tier 1GB storage bucket good for thousands of photos instead
 * of a few hundred.
 *
 * @param {File} file - the raw file the user picked
 * @param {'quote-images'|'about-images'} bucket
 * @param {string} pathPrefix - folder-style prefix, e.g. a quote id or item id
 * @returns {Promise<string>} public URL of the uploaded image
 */
export async function compressAndUpload(file, bucket, pathPrefix) {
  if (!file) throw new Error('No file provided');

  let toUpload = file;
  try {
    toUpload = await imageCompression(file, {
      maxWidthOrHeight: 1600,
      maxSizeMB: 0.3,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.82,
    });
  } catch (err) {
    // If compression fails for any reason (e.g. unsupported format),
    // fall back to uploading the original file rather than blocking the user.
    // eslint-disable-next-line no-console
    console.warn('Image compression failed, uploading original:', err);
  }

  const safePrefix = String(pathPrefix || 'misc').replace(/[^a-zA-Z0-9_-]/g, '');
  const ext = 'jpg';
  const filename = `${safePrefix}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filename, toUpload, {
      cacheControl: '31536000',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Deletes an image from storage given its public URL. Best-effort —
 * failures are swallowed since a dangling file just sits unused in
 * storage rather than breaking the app.
 */
export async function deleteUploadedImage(publicUrl, bucket) {
  if (!publicUrl) return;
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // best-effort, ignore
  }
}
