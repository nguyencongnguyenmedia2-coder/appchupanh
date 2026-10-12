import React, { useState } from 'react';
import {
  Download,
  Clock,
  Trash2,
  X,
  CheckSquare,
  Square,
  FileArchive,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PhotoRecord } from '../../models';
import { getPhotoBlob } from '../../storage/blobStorage';

interface BatchActionsBarProps {
  selectedCount: number;
  totalCount: number;
  selectedPhotos: PhotoRecord[];
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onOpenBatchTimeAdjust: () => void;
  onBatchDelete: () => void;
}

export const BatchActionsBar: React.FC<BatchActionsBarProps> = ({
  selectedCount,
  totalCount,
  selectedPhotos,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  onOpenBatchTimeAdjust,
  onBatchDelete,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  if (selectedCount === 0) return null;

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder('TimeSnap_Photos');

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const blob = await getPhotoBlob(photo.stampedPhotoBlobId);
        if (blob && folder) {
          const fileName = `${photo.id}_${photo.title.replace(/[/\\?%*:|"<>]/g, '_')}.jpg`;
          folder.file(fileName, blob);
        }
        setZipProgress(Math.round(((i + 1) / selectedPhotos.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `TimeSnap_Photos_${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (err: any) {
      alert('Lỗi xuất tệp ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40 mx-auto max-w-2xl animate-in slide-in-from-bottom-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
        {/* Left: count & select all toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-sky-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
          </button>

          <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-500/30">
            Đã chọn: {selectedCount}/{totalCount}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Download ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            title="Tải ảnh đã chọn về dưới dạng ZIP"
          >
            <FileArchive className="h-3.5 w-3.5" />
            <span>{isZipping ? `${zipProgress}%` : 'Tải ZIP'}</span>
          </button>

          {/* Adjust Timestamp */}
          <button
            onClick={onOpenBatchTimeAdjust}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            title="Cộng/Trừ thời gian hàng loạt"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Chỉnh giờ</span>
          </button>

          {/* Delete Batch */}
          <button
            onClick={onBatchDelete}
            className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
            title="Xóa các ảnh đã chọn"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Xóa</span>
          </button>

          {/* Clear selection */}
          <button
            onClick={onClearSelection}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Bỏ chọn"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
