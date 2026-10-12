import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Camera,
  Edit,
  Trash2,
  Calendar,
  Building,
  User,
  MapPin,
} from 'lucide-react';
import { Project, ProjectStatus } from '../models';
import { db } from '../storage/db';
import { ProjectFormModal } from '../components/projects/ProjectFormModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ProjectsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [photoCountMap, setPhotoCountMap] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const loadProjects = async () => {
    const list = await db.projects.toArray();
    setProjects(list);

    // Count photos per project
    const allPhotos = await db.photos.toArray();
    const countMap: Record<string, number> = {};
    for (const p of allPhotos) {
      if (p.projectId) {
        countMap[p.projectId] = (countMap[p.projectId] || 0) + 1;
      }
    }
    setPhotoCountMap(countMap);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    await db.projects.delete(projectToDelete.id);
    setProjectToDelete(null);
    loadProjects();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <FolderKanban className="h-6 w-6 text-sky-400" />
            <span>Quản lý Công trình & Dự án</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi tiến độ, phân chia hạng mục và tổ chức thư viện ảnh theo từng dự án
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950 hover:bg-sky-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm công trình mới</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên công trình, mã DA, địa chỉ..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'in_progress', label: 'Đang thi công' },
            { id: 'planning', label: 'Chuẩn bị' },
            { id: 'paused', label: 'Tạm dừng' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'archived', label: 'Lưu trữ' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                statusFilter === st.id
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">
            Không tìm thấy công trình phù hợp
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo công trình mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const photoCount = photoCountMap[p.id] || 0;
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-sky-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-400 border border-sky-800">
                        {p.code}
                      </span>
                      <h3
                        onClick={() => onNavigate('projectDetail', { projectId: p.id })}
                        className="mt-2 text-base font-bold text-white hover:text-sky-400 cursor-pointer"
                      >
                        {p.name}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        p.status === 'in_progress'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : p.status === 'completed'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : p.status === 'planning'
                          ? 'bg-sky-950/80 text-sky-400 border-sky-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p.status === 'in_progress'
                        ? 'Đang thi công'
                        : p.status === 'completed'
                        ? 'Hoàn thành'
                        : p.status === 'planning'
                        ? 'Chuẩn bị'
                        : 'Tạm dừng'}
                    </span>
                  </div>

                  {/* Address */}
                  {p.address && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p.address}</span>
                    </div>
                  )}

                  {/* Contractor & Manager */}
                  <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                    {p.contractor && (
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">Nhà thầu: {p.contractor}</span>
                      </div>
                    )}
                    {p.manager && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span className="truncate">Phụ trách: {p.manager}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Toolbar: Photo Count, Quick Camera Shoot, Edit, Delete */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <div
                    onClick={() => onNavigate('projectDetail', { projectId: p.id })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5 text-sky-400" />
                    <span>{photoCount} ảnh</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Shoot photo for this project */}
                    <button
                      onClick={() => onNavigate('camera', { projectId: p.id })}
                      className="flex items-center gap-1 rounded-xl bg-sky-600/20 px-2.5 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-600 hover:text-white transition-colors"
                      title="Chụp ảnh cho công trình này"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Chụp</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setProjectToEdit(p);
                        setIsModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Chỉnh sửa công trình"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setProjectToDelete(p)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                      title="Xóa công trình"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        projectToEdit={projectToEdit}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          loadProjects();
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Xác nhận xóa công trình"
        message={`Bạn có chắc chắn muốn xóa công trình "${projectToDelete?.name}"? Các ảnh đã chụp thuộc dự án này vẫn được giữ lại trong thư viện chung.`}
        confirmLabel="Xóa công trình"
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
