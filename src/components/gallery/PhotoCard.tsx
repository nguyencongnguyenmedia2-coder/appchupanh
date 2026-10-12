import React, { useState, useEffect } from 'react';
import { PhotoRecord, Project, WorkItem } from '../../models';
import { getPhotoBlobUrl } from '../../storage/blobStorage';
import { formatDateTime } from '../../services/image/stampEngine';
import { Calendar, CheckSquare, Square } from 'lucide-react';

interface PhotoCardProps {
  photo: PhotoRecord;
  project?: Project;
  workItem?: WorkItem;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick: (photo: PhotoRecord) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  project,
  workItem,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onClick,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadThumb = async () => {
      const url = await getPhotoBlobUrl(photo.thumbnailBlobId || photo.stampedPhotoBlobId);
      if (mounted) setThumbUrl(url);
    };
    loadThumb();

    return () => {
      mounted = false;
    };
  }, [photo.thumbnailBlobId, photo.stampedPhotoBlobId]);

  return (
    <div
      onClick={() => {
        if (isSelectionMode && onToggleSelect) {
          onToggleSelect(photo.id);
        } else {
          onClick(photo);
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/50'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={photo.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 animate-pulse">
            Đang tải ảnh...
          </div>
        )}

        {/* Selection Checkbox (always visible in selection mode or on hover) */}
        {(isSelectionMode || isSelected) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(photo.id);
            }}
            className="absolute top-2.5 left-2.5 z-10 rounded-lg bg-black/60 p-1 text-white backdrop-blur-xs"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-sky-400" />
            ) : (
              <Square className="h-5 w-5 text-slate-300" />
            )}
          </div>
        )}

        {/* Work Item Badge */}
        {(workItem || photo.workItemName) && (
          <div className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-400 backdrop-blur-xs border border-white/10">
            {workItem?.name || photo.workItemName}
          </div>
        )}

        {/* Clean Original Indicator */}
        {photo.originalPhotoBlobId && (
          <div
            className="absolute top-2 right-2 rounded-md bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 border border-emerald-800 backdrop-blur-xs"
            title="Đã lưu ảnh gốc sạch (cho phép chỉnh lại dấu)"
          >
            Ảnh gốc
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="p-3 text-xs">
        <div className="font-semibold text-white truncate" title={photo.title}>
          {photo.title || 'Ảnh công trình'}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Calendar className="h-3 w-3 text-sky-400 shrink-0" />
          <span className="truncate">
            {formatDateTime(photo.displayDateTime, 'DD/MM/YYYY', '24h', false)}
          </span>
        </div>

        {(photo.projectName || project?.name) && (
          <div className="mt-1 truncate text-[11px] font-medium text-sky-400">
            {photo.projectName || project?.name}
          </div>
        )}
      </div>
    </div>
  );
};
