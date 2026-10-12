import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Search,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { PhotoRecord, WorkItem } from '../models';
import { db } from '../storage/db';
import { deletePhotoBlobs } from '../storage/blobStorage';
import { PhotoCard } from '../components/gallery/PhotoCard';
import { BatchActionsBar } from '../components/gallery/BatchActionsBar';
import { BatchTimeAdjustModal } from '../components/gallery/BatchTimeAdjustModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface GalleryPageProps {
  onOpenPhotoDetail: (photo: PhotoRecord) => void;
  onNavigate: (page: string, params?: any) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  onOpenPhotoDetail,
  onNavigate,
}) => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch modals
  const [isBatchTimeAdjustOpen, setIsBatchTimeAdjustOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const loadData = async () => {
    const [allPhotos, allItems] = await Promise.all([
      db.photos.toArray(),
      db.workItems.toArray(),
    ]);

    setPhotos(allPhotos);
    setWorkItems(allItems);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort logic
  const filteredPhotos = photos
    .filter((photo) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        photo.title.toLowerCase().includes(q) ||
        (photo.projectName && photo.projectName.toLowerCase().includes(q)) ||
        (photo.notes && photo.notes.toLowerCase().includes(q)) ||
        (photo.addressDisplay && photo.addressDisplay.toLowerCase().includes(q)) ||
        photo.author.toLowerCase().includes(q);

      // Work Item filter
      const matchesWorkItem =
        selectedWorkItemId === 'all' || photo.workItemId === selectedWorkItemId;

      // Date range filter
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && photo.displayDateTime >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && photo.displayDateTime <= endDate + 'T23:59:59';
      }

      return matchesSearch && matchesWorkItem && matchesDate;
    })
    .sort((a, b) => {
      const timeA = new Date(a.displayDateTime).getTime();
      const timeB = new Date(b.displayDateTime).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Selection handlers
  const handleToggleSelect = (photoId: string) => {
    const next = new Set(selectedIds);
    if (next.has(photoId)) next.delete(photoId);
    else next.add(photoId);
    setSelectedIds(next);
    if (next.size > 0) setIsSelectionMode(true);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    const photosToDelete = photos.filter((p) => selectedIds.has(p.id));

    // Delete associated blobs
    const blobIdsToDelete: string[] = [];
    for (const p of photosToDelete) {
      if (p.stampedPhotoBlobId) blobIdsToDelete.push(p.stampedPhotoBlobId);
      if (p.originalPhotoBlobId) blobIdsToDelete.push(p.originalPhotoBlobId);
      if (p.thumbnailBlobId) blobIdsToDelete.push(p.thumbnailBlobId);
    }

    await deletePhotoBlobs(blobIdsToDelete);
    await db.photos.bulkDelete(idsToDelete);

    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsConfirmDeleteOpen(false);
    loadData();
  };

  const selectedPhotosList = photos.filter((p) => selectedIds.has(p.id));

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-28">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-sky-400" />
            <span>Thư viện Ảnh Hiện trường</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng số {photos.length} ảnh đã chụp và đóng dấu cục bộ trên thiết bị
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              isSelectionMode
                ? 'border-sky-500 bg-sky-500/20 text-sky-400 font-bold'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            <span>{isSelectionMode ? 'Hủy chọn' : 'Chọn nhiều ảnh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo công trình, ghi chú, địa chỉ..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Work item filter */}
          <div>
            <select
              value={selectedWorkItemId}
              onChange={(e) => setSelectedWorkItemId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Tất cả hạng mục</option>
              {workItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
              }
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-xs text-slate-300 hover:text-white"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-sky-400" />
              <span>{sortOrder === 'newest' ? 'Mới nhất trước' : 'Cũ nhất trước'}</span>
            </button>
          </div>
        </div>

        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-sky-400" />
            <span>Khoảng ngày:</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs"
            />
            <span>&rarr;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-sky-400 underline ml-2"
              >
                Xóa lọc ngày
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">
            Không tìm thấy ảnh nào
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hãy chụp thêm ảnh hoặc thay đổi bộ lọc tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPhotos.map((photo) => {
            const item = workItems.find((w) => w.id === photo.workItemId);
            return (
              <PhotoCard
                key={photo.id}
                photo={photo}
                workItem={item}
                isSelected={selectedIds.has(photo.id)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={handleToggleSelect}
                onClick={onOpenPhotoDetail}
              />
            );
          })}
        </div>
      )}

      {/* Floating Batch Actions Bar */}
      <BatchActionsBar
        selectedCount={selectedIds.size}
        totalCount={filteredPhotos.length}
        selectedPhotos={selectedPhotosList}
        isAllSelected={
          filteredPhotos.length > 0 && selectedIds.size === filteredPhotos.length
        }
        onToggleSelectAll={handleToggleSelectAll}
        onClearSelection={handleClearSelection}
        onOpenBatchTimeAdjust={() => setIsBatchTimeAdjustOpen(true)}
        onBatchDelete={() => setIsConfirmDeleteOpen(true)}
      />

      {/* Batch Time Adjust Modal */}
      <BatchTimeAdjustModal
        isOpen={isBatchTimeAdjustOpen}
        selectedPhotos={selectedPhotosList}
        onClose={() => setIsBatchTimeAdjustOpen(false)}
        onCompleted={() => {
          loadData();
          handleClearSelection();
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Xác nhận xóa hàng loạt ảnh"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.size} ảnh đã chọn? Thao tác này sẽ giải phóng dung lượng và không thể hoàn tác.`}
        confirmLabel="Xóa các ảnh đã chọn"
        onConfirm={handleBatchDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
};
