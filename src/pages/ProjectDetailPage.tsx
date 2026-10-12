import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  FileText,
  Plus,
  Layers,
  MapPin,
  Calendar,
  Building,
  User,
  Trash2,
} from 'lucide-react';
import { Project, WorkItem, PhotoRecord } from '../models';
import { db } from '../storage/db';
import { PhotoCard } from '../components/gallery/PhotoCard';
import { formatDateVi } from '../utils/formatters';

interface ProjectDetailPageProps {
  projectId: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenPhotoDetail: (photo: PhotoRecord) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onNavigate,
  onOpenPhotoDetail,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [newWorkItemName, setNewWorkItemName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const loadData = async () => {
    const p = await db.projects.get(projectId);
    setProject(p || null);

    const items = await db.workItems.toArray();
    setWorkItems(items);

    const photoList = await db.photos
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('createdAt');
    setPhotos(photoList);
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Không tìm thấy thông tin công trình.</p>
        <button
          onClick={() => onNavigate('projects')}
          className="mt-4 text-xs font-bold text-sky-400 underline"
        >
          Quay lại danh sách công trình
        </button>
      </div>
    );
  }

  const handleAddWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkItemName.trim()) return;

    const item: WorkItem = {
      id: `item-${Date.now()}`,
      projectId,
      name: newWorkItemName.trim(),
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    await db.workItems.put(item);
    setNewWorkItemName('');
    setIsAddingItem(false);
    loadData();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back button and Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('projects')}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sky-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-400 border border-sky-800">
                {project.code}
              </span>
              <span className="text-xs text-slate-400">
                {project.status === 'in_progress' ? 'Đang thi công' : 'Hoàn thành'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {project.name}
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('camera', { projectId: project.id })}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950 hover:bg-sky-500"
          >
            <Camera className="h-4 w-4" />
            <span>Chụp ảnh công trình</span>
          </button>

          <button
            onClick={() => onNavigate('reports', { projectId: project.id })}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <FileText className="h-4 w-4" />
            <span>Lập báo cáo PDF</span>
          </button>
        </div>
      </div>

      {/* Info Details Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: General info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:col-span-2 space-y-3 text-xs">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Thông tin dự án
          </h4>

          {project.address && (
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span>{project.address}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400">Chủ đầu tư:</span>
              <p className="font-semibold text-white mt-0.5">{project.investor || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Tổng thầu:</span>
              <p className="font-semibold text-white mt-0.5">{project.contractor || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Chỉ huy trưởng:</span>
              <p className="font-semibold text-white mt-0.5">{project.manager || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Thời gian thực hiện:</span>
              <p className="font-semibold text-white mt-0.5">
                {formatDateVi(project.startDate)} &rarr; {formatDateVi(project.expectedEndDate) || 'Đang cập nhật'}
              </p>
            </div>
          </div>

          {project.description && (
            <div className="pt-2 border-t border-slate-800 text-slate-300">
              <span className="text-slate-400 block mb-1">Quy mô & Mô tả:</span>
              <p>{project.description}</p>
            </div>
          )}
        </div>

        {/* Right Column: Work Items */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-amber-400" />
              <span>Hạng mục thi công</span>
            </h4>
            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm</span>
            </button>
          </div>

          {isAddingItem && (
            <form onSubmit={handleAddWorkItem} className="flex gap-2">
              <input
                type="text"
                value={newWorkItemName}
                onChange={(e) => setNewWorkItemName(e.target.value)}
                placeholder="Tên hạng mục..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-white text-xs"
              />
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white"
              >
                Lưu
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {workItems.map((item) => (
              <span
                key={item.id}
                className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Project Photos Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-sky-400" />
              <span>Thư viện ảnh dự án ({photos.length} ảnh)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ảnh hiện trường được chụp và đóng dấu cho công trình này
            </p>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <Camera className="mx-auto h-10 w-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              Chưa có ảnh nào cho công trình này
            </p>
            <button
              onClick={() => onNavigate('camera', { projectId: project.id })}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Mở camera chụp ảnh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                project={project}
                onClick={onOpenPhotoDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
