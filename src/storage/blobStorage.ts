import { db, PhotoBlobRecord } from './db';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// Memory cache for Object URLs to avoid leaking memory and revoke properly
const urlCache = new Map<string, string>();

export async function savePhotoBlob(
  id: string,
  photoId: string,
  type: 'original' | 'stamped' | 'thumbnail',
  blob: Blob,
  mimeType: string = 'image/jpeg'
): Promise<PhotoBlobRecord> {
  const record: PhotoBlobRecord = {
    id,
    photoId,
    type,
    mimeType,
    blob,
    size: blob.size,
    createdAt: new Date().toISOString(),
  };

  await db.photoBlobs.put(record);
  return record;
}

export async function getPhotoBlob(blobId: string): Promise<Blob | null> {
  if (!blobId) return null;
  const record = await db.photoBlobs.get(blobId);
  return record ? record.blob : null;
}

export async function getPhotoBlobUrl(blobId: string): Promise<string | null> {
  if (!blobId) return null;

  if (urlCache.has(blobId)) {
    return urlCache.get(blobId)!;
  }

  const blob = await getPhotoBlob(blobId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  urlCache.set(blobId, url);
  return url;
}

export function revokePhotoBlobUrl(blobId: string): void {
  if (urlCache.has(blobId)) {
    const url = urlCache.get(blobId)!;
    URL.revokeObjectURL(url);
    urlCache.delete(blobId);
  }
}

export function revokeAllCachedUrls(): void {
  for (const [_, url] of urlCache.entries()) {
    URL.revokeObjectURL(url);
  }
  urlCache.clear();
}

export async function deletePhotoBlobs(blobIds: string[]): Promise<void> {
  for (const id of blobIds) {
    revokePhotoBlobUrl(id);
  }
  await db.photoBlobs.bulkDelete(blobIds);
}

// Convert blob to base64 for native filesystem or canvas export
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip data:image/xxx;base64, if needed
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export photo to device native gallery / downloads
export async function exportPhotoToDevice(
  blob: Blob,
  fileName: string
): Promise<{ success: boolean; filePath?: string; message?: string }> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Filesystem on native Android / iOS
      const base64Data = await blobToBase64(blob);
      const pureBase64 = base64Data.split(',')[1] || base64Data;

      const result = await Filesystem.writeFile({
        path: `Pictures/TimeSnap/${fileName}`,
        data: pureBase64,
        directory: Directory.Documents,
        recursive: true,
      });

      return {
        success: true,
        filePath: result.uri,
        message: 'Đã lưu ảnh vào thiết bị: ' + result.uri,
      };
    } else {
      // Browser / PWA fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        message: 'Đã tải ảnh về thư mục Tải xuống',
      };
    }
  } catch (error: any) {
    console.error('Error exporting photo to device:', error);
    return {
      success: false,
      message: error?.message || 'Không thể lưu ảnh vào thiết bị',
    };
  }
}
