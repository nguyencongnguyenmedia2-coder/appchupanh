import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Stamp,
  Trash2,
  Calendar,
  MapPin,
  Shield,
  Layers,
  FolderKanban,
  FileText,
  User,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { PhotoRecord, Project, WorkItem } from '../../models';
import { getPhotoBlob, getPhotoBlobUrl, exportPhotoToDevice } from '../../storage/blobStorage';
import { formatDateTime } from '../../services/image/stampEngine';
import { formatBytes } from '../../utils/formatters';

interface PhotoDetailModalProps {
  photo: PhotoRecord;
  project?: Project;
  workItem?: WorkItem;
  isOpen: boolean;
  onClose: () => void;
  onRestamp: (photo: PhotoRecord) => void;
  onDelete: (photoId: string) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  project,
  workItem,
  isOpen,
  onClose,
  onRestamp,
  onDelete,
}) => {
  const [stampedUrl, setStampedUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'stamped' | 'original'>('stamped');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const loadUrls = async () => {
      const sUrl = await getPhotoBlobUrl(photo.stampedPhotoBlobId);
      if (mounted) setStampedUrl(sUrl);

      if (photo.originalPhotoBlobId) {
        const oUrl = await getPhotoBlobUrl(photo.originalPhotoBlobId);
        if (mounted) setOriginalUrl(oUrl);
      }
    };
    loadUrls();

    return () => {
      mounted = false;
      setZoomLevel(1);
    };
  }, [photo.id, photo.stampedPhotoBlobId, photo.originalPhotoBlobId]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const targetBlobId =
        activeView === 'original' && photo.originalPhotoBlobId
          ? photo.originalPhotoBlobId
          : photo.stampedPhotoBlobId;

      const blob = await getPhotoBlob(targetBlobId);
      if (blob) {
        const fileName = `TimeSnap_${photo.id.slice(0, 10)}_${activeView}.jpg`;
        await exportPhotoToDevice(blob, fileName);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const currentDisplayUrl = activeView === 'original' && originalUrl ? originalUrl : stampedUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-base sm:text-lg truncate max-w-sm">
              {photo.title || 'Chi tiết ảnh'}
            </h3>
            <span className="rounded bg-sky-950 px-2 py-0.5 text-xs text-sky-400 border border-sky-800 hidden sm:inline">
              #{photo.id.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Stamped vs Clean Original */}
            {originalUrl && (
              <div className="flex rounded-xl bg-slate-800 p-1 text-xs">
                <button
                  onClick={() => setActiveView('stamped')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                    activeView === 'stamped'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ảnh có dấu
                </button>
                <button
                  onClick={() => setActiveView('original')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                    activeView === 'original'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ảnh gốc sạch
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-3">
          {/* Main Visualizer Area (2 cols) */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden bg-slate-950 lg:col-span-2">
            {/* Floating Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-xl bg-slate-900/80 p-1.5 backdrop-blur-md border border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs text-slate-300 w-10 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
                className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Image Canvas Container */}
            <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
              {currentDisplayUrl ? (
                <img
                  src={currentDisplayUrl}
                  alt={photo.title}
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-150"
                />
              ) : (
                <div className="text-slate-500 text-sm">Đang nạp ảnh...</div>
              )}
            </div>
          </div>

          {/* Metadata Inspector Sidebar (1 col) */}
          <div className="flex flex-col justify-between overflow-y-auto border-t border-slate-800 bg-slate-900/80 p-5 lg:border-t-0 lg:border-l text-xs">
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-sky-400" />
                <span>Hồ sơ Dữ liệu Hiện trường</span>
              </h4>

              {/* Time Section: Original vs Display */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-sky-400" />
                    <span>Thời gian hiển thị:</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
                      photo.dateTimeSource === 'device'
                        ? 'bg-sky-950 text-sky-400 border-sky-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {photo.dateTimeSource === 'device' ? 'Dữ liệu Thiết bị' : 'Tùy chỉnh'}
                  </span>
                </div>
                <div className="font-mono text-white text-sm">
                  {formatDateTime(photo.displayDateTime, 'DD/MM/YYYY', '24h', true)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Gốc lúc chụp: {formatDateTime(photo.capturedAtOriginal, 'DD/MM/YYYY', '24h', true)}
                </div>
              </div>

              {/* GPS Coordinates: Original vs Display */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" />
                    <span>Tọa độ GPS:</span>
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
                      photo.gpsSource === 'device'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : photo.gpsSource === 'manual'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {photo.gpsSource === 'device'
                      ? 'GPS Thật'
                      : photo.gpsSource === 'manual'
                      ? 'Nhập tay'
                      : 'Không có'}
                  </span>
                </div>
                {photo.gpsDisplay ? (
                  <div className="font-mono text-white">
                    {photo.gpsDisplay.latitude.toFixed(6)}°N, {photo.gpsDisplay.longitude.toFixed(6)}°E
                  </div>
                ) : (
                  <div className="text-slate-400">Chưa xác định tọa độ</div>
                )}
                {photo.addressDisplay && (
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                    <span className="font-semibold text-slate-400">Địa chỉ: </span>
                    {photo.addressDisplay}
                  </div>
                )}
              </div>

              {/* Project & Category info */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-sky-400" />
                    <span>Dự án:</span>
                  </span>
                  <span className="font-semibold text-white">
                    {project?.name || 'Chưa gán'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-amber-400" />
                    <span>Hạng mục:</span>
                  </span>
                  <span className="font-semibold text-amber-400">
                    {workItem?.name || 'Mặc định'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-sky-400" />
                    <span>Người chụp:</span>
                  </span>
                  <span className="text-slate-200">{photo.author || 'Kỹ sư'}</span>
                </div>
              </div>

              {/* Notes */}
              {photo.notes && (
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                  <span className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                    <FileText className="h-3.5 w-3.5 text-amber-400" />
                    <span>Ghi chú hiện trường:</span>
                  </span>
                  <p className="text-slate-200">{photo.notes}</p>
                </div>
              )}

              {/* SHA-256 Hash Section */}
              {photo.sha256Hash && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-sky-400" />
                    <span>Mã băm toàn vẹn (SHA-256):</span>
                  </span>
                  <div className="font-mono text-[10px] text-sky-300 break-all select-all bg-slate-900 p-1.5 rounded border border-slate-800">
                    {photo.sha256Hash}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    *Mã băm chứng minh tệp không bị sửa đổi sau khi xuất ảnh; không thay thế chứng thực chữ ký số pháp lý.
                  </p>
                </div>
              )}

              {/* File Specs */}
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Kích thước: {photo.width} × {photo.height} px</span>
                <span>Dung lượng: {formatBytes(photo.sizeBytes)}</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="mt-6 flex flex-col gap-2 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5 font-bold text-white shadow-md shadow-sky-950 hover:bg-sky-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Đang tải...' : 'Tải về máy'}</span>
                </button>

                <button
                  onClick={() => onRestamp(photo)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Stamp className="h-4 w-4" />
                  <span>Sửa dấu ảnh</span>
                </button>
              </div>

              <button
                onClick={() => onDelete(photo.id)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa ảnh này</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
