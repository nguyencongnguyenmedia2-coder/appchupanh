export type ProjectStatus = 'planning' | 'in_progress' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  code: string;
  investor: string;        // Chủ đầu tư
  contractor: string;      // Nhà thầu
  manager: string;         // Người phụ trách
  address: string;         // Địa chỉ công trình
  startDate: string;       // YYYY-MM-DD
  expectedEndDate: string; // YYYY-MM-DD
  description: string;
  status: ProjectStatus;
  notes: string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
}

export interface WorkItem {
  id: string;
  projectId?: string;      // Optional
  name: string;            // Móng, Cốt thép, Cốp pha, Bê tông, v.v.
  isDefault?: boolean;
  createdAt: string;
}

export type StampPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar' | 'top-bar';

export interface StampFieldsConfig {
  showDateTime: boolean;
  showGps: boolean;
  showAddress: boolean;
  showProject: boolean;
  showWorkItem: boolean;
  showAuthor: boolean;
  showContractor: boolean;
  showNotes: boolean;
  showPhotoId: boolean;
  showIntegrityHash: boolean;
  showLogo: boolean;
}

export interface StampTemplate {
  id: string;
  name: string;
  isPreset: boolean;
  isDefault?: boolean;
  position: StampPosition;
  textColor: string;       // Hex e.g. #ffffff, #fef08a
  bgColor: string;         // Hex e.g. #0f172a, #000000
  bgOpacity: number;       // 0 to 1
  fontSize: number;        // Scale factor: 14 to 32
  fontFamily: string;      // Arial, Roboto, monospace, sans-serif
  lineHeight: number;      // 1.2 to 1.8
  logoUrl?: string;        // Data URL or blob URL
  logoPosition?: 'left' | 'right' | 'top';
  fields: StampFieldsConfig;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  timeFormat: '24h' | '12h';
  showSeconds: boolean;
  gpsDecimals: number;     // 4 to 6
}

export type DataSource = 'device' | 'manual' | 'adjusted' | 'geocoded' | 'none';

export interface PhotoRecord {
  id: string;
  projectId?: string;
  projectName?: string;       // Tên công trình / vị trí hiển thị trực tiếp
  workItemId?: string;
  workItemName?: string;
  title: string;
  notes?: string;

  // Thời điểm
  capturedAtOriginal: string; // ISO date/time recorded by device
  displayDateTime: string;    // Custom / display date/time
  dateTimeSource: 'device' | 'manual' | 'adjusted';
  timeZoneOffset?: number;

  // GPS
  gpsOriginal: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
  } | null;
  gpsDisplay: {
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null;
  gpsSource: 'device' | 'manual' | 'none';

  // Địa chỉ
  addressOriginal?: string | null;
  addressDisplay: string;
  addressSource: 'geocoded' | 'manual' | 'none';

  // Người chụp & Đơn vị
  author: string;
  contractor?: string;

  // Lưu trữ ảnh
  originalPhotoBlobId?: string; // ID của ảnh gốc chưa đóng dấu (nếu lưu)
  stampedPhotoBlobId: string;   // ID của ảnh đã đóng dấu
  thumbnailBlobId: string;      // ID của ảnh thumbnail
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;

  // Dấu ảnh đã dùng
  templateSnapshot: StampTemplate;
  sha256Hash?: string;

  createdAt: string;
  updatedAt: string;
}

export type ReportType = 'daily' | 'progress' | 'inspection' | 'safety' | 'defect' | 'acceptance' | 'incident' | 'custom';

export interface ReportPhotoItem {
  photoId: string;
  caption: string;
  order: number;
}

export interface ReportRecord {
  id: string;
  reportCode: string;
  reportType: ReportType;
  projectId?: string;
  projectName?: string;      // Tên công trình hiển thị trực tiếp
  workItemId?: string;
  title: string;
  reportDate: string;        // YYYY-MM-DD
  author: string;
  workContent: string;       // Nội dung công việc
  progressPercentage?: number;
  issuesToResolve?: string;  // Vấn đề cần khắc phục
  recommendations?: string;  // Kiến nghị
  notes?: string;
  layoutColumns: 1 | 2 | 4;  // Bố cục ảnh trên trang PDF
  photoItems: ReportPhotoItem[];
  signatureInfo: {
    preparedBy: string;      // Người lập
    reviewedBy?: string;     // Cán bộ giám sát
    approvedBy?: string;     // Chỉ huy trưởng
  };
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultResolution: '4k' | '1080p' | '720p';
  autoSaveOriginal: boolean;
  defaultTemplateId: string;
  defaultAuthor: string;
  defaultContractor: string;
  watermarkDisclaimer: boolean;
}
