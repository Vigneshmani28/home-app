import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase/client';

import type { ListingImage } from '../types';

const BUCKET = 'listing-images';

/**
 * Generates a filename-safe unique id. Neither `uuid` nor
 * `expo-crypto` are installed in this project, and RN's global
 * `crypto.randomUUID` is not reliably available across engines/platforms,
 * so we fall back to a timestamp + random-suffix id. This is unique enough
 * for storage object names (collisions are not a correctness concern here,
 * only a naming one) — revisit if a real UUID becomes necessary elsewhere.
 */
function generateFileId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}${random}`;
}

/** Public URL for a storage path in the (public) listing-images bucket. */
export function getPublicImageUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

/**
 * Reads a local image URI (from expo-image-picker) into raw bytes for
 * upload.
 *
 * NOTE: we intentionally do NOT use `fetch(uri).then(r => r.arrayBuffer())`
 * here — on React Native that path is unreliable for local `file://` URIs
 * and can silently resolve to a tiny/corrupt buffer (this previously caused
 * uploaded images to land in Storage as ~14 byte unviewable files). The
 * `expo-file-system` `File` API reads the file directly off disk instead.
 * Falls back to `fetch` for URI schemes `File` can't handle (e.g. a rare
 * Android `content://` URI from the image picker).
 */
async function readLocalFileBytes(uri: string): Promise<Uint8Array> {
  try {
    return await new File(uri).bytes();
  } catch {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

export interface UploadListingImageOptions {
  displayOrder?: number;
}

/**
 * Uploads a local image (from expo-image-picker) to the listing-images
 * bucket at `{userId}/{listingId}/{fileId}.jpg` and records a
 * `listing_images` row.
 *
 * NOTE: expo-image-manipulator is not installed in this project. Client-side
 * resize/compression is therefore limited to expo-image-picker's own
 * `quality` option (set by the caller when launching the picker) — images
 * are uploaded largely as-is otherwise. Revisit if upload sizes become a
 * problem; adding expo-image-manipulator would let us resize before upload.
 */
export async function uploadListingImage(
  userId: string,
  listingId: string,
  localUri: string,
  options: UploadListingImageOptions = {},
): Promise<ListingImage> {
  const fileId = generateFileId();
  const storagePath = `${userId}/${listingId}/${fileId}.jpg`;

  const bytes = await readLocalFileBytes(localUri);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('listing_images')
    .insert({
      listing_id: listingId,
      storage_path: storagePath,
      display_order: options.displayOrder ?? 0,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return data;
}

export async function deleteListingImage(imageId: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from('listing_images').delete().eq('id', imageId);
  if (dbError) throw dbError;
}
