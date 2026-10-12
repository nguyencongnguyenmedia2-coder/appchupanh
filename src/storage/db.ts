import Dexie, { type Table } from 'dexie';
import {
  Project,
  WorkItem,
  PhotoRecord,
  StampTemplate,
  ReportRecord,
  SavedLocation,
  AppSettings,
} from '../models';
import { PRESET_STAMP_TEMPLATES, DEFAULT_WORK_ITEMS } from '../models/defaultTemplates';

export interface PhotoBlobRecord {
  id: string; // matches originalPhotoBlobId, stampedPhotoBlobId, or thumbnailBlobId
  photoId: string;
  type: 'original' | 'stamped' | 'thumbnail';
  mimeType: string;
  blob: Blob;
  size: number;
  createdAt: string;
}

export interface SettingRecord {
  key: string;
  value: any;
}

export class TimeSnapDatabase extends Dexie {
  projects!: Table<Project, string>;
  workItems!: Table<WorkItem, string>;
  photos!: Table<PhotoRecord, string>;
  photoBlobs!: Table<PhotoBlobRecord, string>;
  stampTemplates!: Table<StampTemplate, string>;
  reports!: Table<ReportRecord, string>;
  savedLocations!: Table<SavedLocation, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('TimeSnapConstructionProDB');

    this.version(1).stores({
      projects: 'id, code, status, createdAt',
      workItems: 'id, projectId, name',
      photos: 'id, projectId, workItemId, displayDateTime, capturedAtOriginal, createdAt',
      photoBlobs: 'id, photoId, type',
      stampTemplates: 'id, name, isPreset',
      reports: 'id, reportCode, projectId, reportDate, createdAt',
      savedLocations: 'id, name',
      settings: 'key',
    });

    this.on('populate', () => {
      this.seedInitialData();
    });
  }

  async seedInitialData(): Promise<void> {
    // 1. Seed stamp templates
    await this.stampTemplates.bulkAdd(PRESET_STAMP_TEMPLATES);

    // 2. Seed default work items
    const now = new Date().toISOString();
    const workItems: WorkItem[] = DEFAULT_WORK_ITEMS.map((name, index) => ({
      id: `default-item-${index + 1}`,
      name,
      isDefault: true,
      createdAt: now,
    }));
    await this.workItems.bulkAdd(workItems);

    // 3. Seed demo sample project
    const defaultProject: Project = {
      id: 'proj-demo-1',
      name: 'Tòa nhà Phức hợp Sky Garden',
      code: 'SG-2026',
      investor: 'Tập đoàn Bất động sản Hòa Bình',
      contractor: 'Tổng thầu Xây dựng Delta',
      manager: 'Kỹ sư Nguyễn Văn An',
      address: 'Khu đô thị mới An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
      startDate: '2026-03-01',
      expectedEndDate: '2027-12-30',
      description: 'Dự án tổ hợp trung tâm thương mại và căn hộ cao cấp 28 tầng.',
      status: 'in_progress',
      notes: 'Hiện đang thi công hạng mục cốt thép và bê tông sàn tầng 8.',
      createdAt: now,
      updatedAt: now,
    };
    await this.projects.add(defaultProject);

    // 4. Seed default app settings
    const defaultSettings: AppSettings = {
      theme: 'dark',
      defaultResolution: '1080p',
      autoSaveOriginal: true,
      defaultTemplateId: 'preset-standard',
      defaultAuthor: 'Kỹ sư Giám sát',
      defaultContractor: 'Delta Construction',
      watermarkDisclaimer: true,
    };
    await this.settings.put({ key: 'appSettings', value: defaultSettings });
  }
}

export const db = new TimeSnapDatabase();

// Helper to ensure database is seeded even if database already existed before population
export async function initializeDatabase(): Promise<void> {
  const templateCount = await db.stampTemplates.count();
  if (templateCount === 0) {
    await db.stampTemplates.bulkPut(PRESET_STAMP_TEMPLATES);
  }

  const workItemCount = await db.workItems.count();
  if (workItemCount === 0) {
    const now = new Date().toISOString();
    const workItems: WorkItem[] = DEFAULT_WORK_ITEMS.map((name, index) => ({
      id: `default-item-${index + 1}`,
      name,
      isDefault: true,
      createdAt: now,
    }));
    await db.workItems.bulkPut(workItems);
  }

  const settings = await db.settings.get('appSettings');
  if (!settings) {
    const defaultSettings: AppSettings = {
      theme: 'dark',
      defaultResolution: '1080p',
      autoSaveOriginal: true,
      defaultTemplateId: 'preset-standard',
      defaultAuthor: 'Kỹ sư Giám sát',
      defaultContractor: 'Delta Construction',
      watermarkDisclaimer: true,
    };
    await db.settings.put({ key: 'appSettings', value: defaultSettings });
  }
}

// Storage usage estimation
export async function getStorageStats(): Promise<{
  photoCount: number;
  projectCount: number;
  reportCount: number;
  estimatedBytesUsed: number;
  quotaBytes: number;
}> {
  const [photoCount, projectCount, reportCount] = await Promise.all([
    db.photos.count(),
    db.projects.count(),
    db.reports.count(),
  ]);

  let estimatedBytesUsed = 0;
  let quotaBytes = 0;

  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    estimatedBytesUsed = estimate.usage || 0;
    quotaBytes = estimate.quota || 0;
  } else {
    // Fallback: sum blob sizes from table
    const blobs = await db.photoBlobs.toArray();
    estimatedBytesUsed = blobs.reduce((sum, b) => sum + (b.size || 0), 0);
    quotaBytes = 1024 * 1024 * 1024; // 1GB estimate
  }

  return {
    photoCount,
    projectCount,
    reportCount,
    estimatedBytesUsed,
    quotaBytes,
  };
}

// Clean up orphan blobs not referenced by any photo
export async function cleanupOrphanBlobs(): Promise<number> {
  const allPhotos = await db.photos.toArray();
  const referencedBlobIds = new Set<string>();

  for (const p of allPhotos) {
    if (p.stampedPhotoBlobId) referencedBlobIds.add(p.stampedPhotoBlobId);
    if (p.originalPhotoBlobId) referencedBlobIds.add(p.originalPhotoBlobId);
    if (p.thumbnailBlobId) referencedBlobIds.add(p.thumbnailBlobId);
  }

  const allBlobs = await db.photoBlobs.toArray();
  const orphans = allBlobs.filter((b) => !referencedBlobIds.has(b.id));

  if (orphans.length > 0) {
    const idsToDelete = orphans.map((b) => b.id);
    await db.photoBlobs.bulkDelete(idsToDelete);
  }

  return orphans.length;
}
