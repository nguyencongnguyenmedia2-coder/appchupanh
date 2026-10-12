import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../storage/db';
import { getPhotoBlob, savePhotoBlob } from '../../storage/blobStorage';
import { Project, PhotoRecord, StampTemplate, ReportRecord, WorkItem, SavedLocation } from '../../models';

export interface BackupManifest {
  version: number;
  appName: string;
  exportedAt: string;
  projectCount: number;
  photoCount: number;
  reportCount: number;
  projectIdFilter?: string;
}

export interface BackupProgressCallback {
  (current: number, total: number, message: string): void;
}

export interface ImportBackupOptions {
  onConflict: 'skip' | 'overwrite';
  onProgress?: BackupProgressCallback;
}

export interface ImportBackupResult {
  success: boolean;
  importedProjects: number;
  importedPhotos: number;
  importedReports: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Exports complete database or project-specific data into a structured ZIP file.
 */
export async function exportBackupZip(
  projectIdFilter?: string,
  onProgress?: BackupProgressCallback
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Fetch metadata
  let projects: Project[] = [];
  let photos: PhotoRecord[] = [];
  let reports: ReportRecord[] = [];
  let workItems: WorkItem[] = [];
  let templates: StampTemplate[] = [];
  let locations: SavedLocation[] = [];

  if (projectIdFilter) {
    const p = await db.projects.get(projectIdFilter);
    if (p) projects = [p];
    photos = await db.photos.where('projectId').equals(projectIdFilter).toArray();
    reports = await db.reports.where('projectId').equals(projectIdFilter).toArray();
    workItems = await db.workItems.where('projectId').equals(projectIdFilter).toArray();
  } else {
    projects = await db.projects.toArray();
    photos = await db.photos.toArray();
    reports = await db.reports.toArray();
    workItems = await db.workItems.toArray();
    templates = await db.stampTemplates.toArray();
    locations = await db.savedLocations.toArray();
  }

  const manifest: BackupManifest = {
    version: 1,
    appName: 'TimeSnap Construction Pro',
    exportedAt: new Date().toISOString(),
    projectCount: projects.length,
    photoCount: photos.length,
    reportCount: reports.length,
    projectIdFilter,
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('data/projects.json', JSON.stringify(projects, null, 2));
  zip.file('data/photos.json', JSON.stringify(photos, null, 2));
  zip.file('data/reports.json', JSON.stringify(reports, null, 2));
  zip.file('data/workItems.json', JSON.stringify(workItems, null, 2));
  zip.file('data/templates.json', JSON.stringify(templates, null, 2));
  zip.file('data/locations.json', JSON.stringify(locations, null, 2));

  // 2. Add photo blobs
  const photosFolder = zip.folder('photos');
  const totalItems = photos.length;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (onProgress) {
      onProgress(i + 1, totalItems, `Đang nén ảnh ${i + 1}/${totalItems}...`);
    }

    // Add stamped photo
    if (photo.stampedPhotoBlobId && photosFolder) {
      const blob = await getPhotoBlob(photo.stampedPhotoBlobId);
      if (blob) {
        photosFolder.file(`${photo.stampedPhotoBlobId}.jpg`, blob);
      }
    }

    // Add original photo if exists
    if (photo.originalPhotoBlobId && photosFolder) {
      const originalBlob = await getPhotoBlob(photo.originalPhotoBlobId);
      if (originalBlob) {
        photosFolder.file(`${photo.originalPhotoBlobId}.jpg`, originalBlob);
      }
    }

    // Add thumbnail
    if (photo.thumbnailBlobId && photosFolder) {
      const thumbBlob = await getPhotoBlob(photo.thumbnailBlobId);
      if (thumbBlob) {
        photosFolder.file(`${photo.thumbnailBlobId}.jpg`, thumbBlob);
      }
    }
  }

  if (onProgress) {
    onProgress(totalItems, totalItems, 'Đang hoàn tất gói ZIP sao lưu...');
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(
          Math.round(metadata.percent),
          100,
          `Đang đóng gói ZIP: ${Math.round(metadata.percent)}%`
        );
      }
    }
  );

  return zipBlob;
}

/**
 * Downloads the exported backup ZIP file.
 */
export async function downloadBackupZip(
  projectIdFilter?: string,
  onProgress?: BackupProgressCallback
): Promise<void> {
  const blob = await exportBackupZip(projectIdFilter, onProgress);
  const now = new Date().toISOString().slice(0, 10);
  const fileName = `TimeSnap_Backup_${projectIdFilter ? 'Project_' : 'Full_'}${now}.zip`;
  saveAs(blob, fileName);
}

/**
 * Imports and restores a backup ZIP file with security checks and conflict resolution.
 */
export async function importBackupZip(
  zipFile: File | Blob,
  options: ImportBackupOptions
): Promise<ImportBackupResult> {
  const result: ImportBackupResult = {
    success: false,
    importedProjects: 0,
    importedPhotos: 0,
    importedReports: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    const zip = await JSZip.loadAsync(zipFile);

    // 1. Verify manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      result.errors.push('Tệp ZIP không hợp lệ: Thiếu manifest.json');
      return result;
    }

    const manifestText = await manifestFile.async('string');
    const manifest: BackupManifest = JSON.parse(manifestText);

    if (!manifest.version || manifest.version > 1) {
      result.errors.push(`Phiên bản sao lưu không được hỗ trợ: ${manifest.version}`);
      return result;
    }

    // 2. Read Projects
    const projectsFile = zip.file('data/projects.json');
    if (projectsFile) {
      const projects: Project[] = JSON.parse(await projectsFile.async('string'));
      for (const p of projects) {
        const existing = await db.projects.get(p.id);
        if (existing && options.onConflict === 'skip') {
          result.skippedCount++;
          continue;
        }
        await db.projects.put(p);
        result.importedProjects++;
      }
    }

    // 3. Read Work Items
    const workItemsFile = zip.file('data/workItems.json');
    if (workItemsFile) {
      const items: WorkItem[] = JSON.parse(await workItemsFile.async('string'));
      for (const item of items) {
        await db.workItems.put(item);
      }
    }

    // 4. Read Reports
    const reportsFile = zip.file('data/reports.json');
    if (reportsFile) {
      const reports: ReportRecord[] = JSON.parse(await reportsFile.async('string'));
      for (const r of reports) {
        const existing = await db.reports.get(r.id);
        if (existing && options.onConflict === 'skip') {
          result.skippedCount++;
          continue;
        }
        await db.reports.put(r);
        result.importedReports++;
      }
    }

    // 5. Read Templates & Locations if present
    const templatesFile = zip.file('data/templates.json');
    if (templatesFile) {
      const templates: StampTemplate[] = JSON.parse(await templatesFile.async('string'));
      for (const t of templates) {
        await db.stampTemplates.put(t);
      }
    }

    // 6. Read Photos and Blobs
    const photosFile = zip.file('data/photos.json');
    if (photosFile) {
      const photos: PhotoRecord[] = JSON.parse(await photosFile.async('string'));
      const total = photos.length;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (options.onProgress) {
          options.onProgress(i + 1, total, `Đang khôi phục ảnh ${i + 1}/${total}...`);
        }

        const existing = await db.photos.get(photo.id);
        if (existing && options.onConflict === 'skip') {
          result.skippedCount++;
          continue;
        }

        // Restore stamped blob
        if (photo.stampedPhotoBlobId) {
          const blobFile = zip.file(`photos/${photo.stampedPhotoBlobId}.jpg`);
          if (blobFile) {
            const blob = await blobFile.async('blob');
            await savePhotoBlob(photo.stampedPhotoBlobId, photo.id, 'stamped', blob);
          }
        }

        // Restore original clean blob
        if (photo.originalPhotoBlobId) {
          const blobFile = zip.file(`photos/${photo.originalPhotoBlobId}.jpg`);
          if (blobFile) {
            const blob = await blobFile.async('blob');
            await savePhotoBlob(photo.originalPhotoBlobId, photo.id, 'original', blob);
          }
        }

        // Restore thumbnail
        if (photo.thumbnailBlobId) {
          const blobFile = zip.file(`photos/${photo.thumbnailBlobId}.jpg`);
          if (blobFile) {
            const blob = await blobFile.async('blob');
            await savePhotoBlob(photo.thumbnailBlobId, photo.id, 'thumbnail', blob);
          }
        }

        await db.photos.put(photo);
        result.importedPhotos++;
      }
    }

    result.success = true;
    return result;
  } catch (err: any) {
    result.errors.push(err?.message || 'Lỗi không xác định khi giải nén tệp sao lưu');
    return result;
  }
}
