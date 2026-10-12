import React, { useState, useEffect } from 'react';
import {
  Camera,
  FolderKanban,
  FileText,
  HardDrive,
  Plus,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  HardHat,
  Calendar,
} from 'lucide-react';
import { db, getStorageStats } from '../storage/db';
import { Project, PhotoRecord, ReportRecord } from '../models';
import { formatBytes } from '../utils/formatters';
import { PhotoCard } from '../components/gallery/PhotoCard';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenPhotoDetail: (photo: PhotoRecord) => void;
  onOpenNewProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenPhotoDetail,
  onOpenNewProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentPhotos, setRecentPhotos] = useState<PhotoRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [stats, setStats] = useState<{
    photoCount: number;
    projectCount: number;
    reportCount: number;
    estimatedBytesUsed: number;
    quotaBytes: number;
  }>({
    photoCount: 0,
    projectCount: 0,
    reportCount: 0,
    estimatedBytesUsed: 0,
    quotaBytes: 1024 * 1024 * 1024,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      const [pList, photosList, rList, st] = await Promise.all([
        db.projects.toArray(),
        db.photos.orderBy('createdAt').reverse().limit(8).toArray(),
        db.reports.toArray(),
        getStorageStats(),
      ]);

      setProjects(pList);
      setRecentPhotos(photosList);
      setReports(rList);
      setStats(st);
    };

    loadDashboard();
  }, []);

  const usedPercent = stats.quotaBytes > 0
    ? Math.min(100, Math.round((stats.estimatedBytesUsed / stats.quotaBytes) * 100))
    : 0;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero Banner: Quick Capture Card */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-400 border border-sky-500/30">
            <HardHat className="h-3.5 w-3.5" />
            <span>Hệ thống Chụp ảnh & Giám sát Công trình</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Chụp ảnh đóng dấu ngày giờ, tọa độ GPS & địa chỉ hiện trường
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Ứng dụng kiến trúc Local-First hoạt động 100% ngoại tuyến (Offline). Ảnh và dữ liệu được lưu trữ trực tiếp trên thiết bị của bạn với đầy đủ tính năng xuất báo cáo PDF và bảo toàn dữ liệu gốc.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('camera')}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 font-bold text-white shadow-xl shadow-sky-600/30 hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              <Camera className="h-5 w-5" />
              <span>Chụp ảnh ngay</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all text-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Lập báo cáo PDF</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Photos Metric */}
        <div
          onClick={() => onNavigate('gallery')}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng số ảnh
            </span>
            <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white">
            {stats.photoCount}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-400">
            <span>Trong thư viện cục bộ</span>
          </div>
        </div>

        {/* Projects Metric */}
        <div
          onClick={() => onNavigate('projects')}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Công trình
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white">
            {stats.projectCount}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-400">
            <span>Đang theo dõi</span>
          </div>
        </div>

        {/* Reports Metric */}
        <div
          onClick={() => onNavigate('reports')}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Báo cáo PDF
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white">
            {stats.reportCount}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-400">
            <span>Đã tạo & lưu trữ</span>
          </div>
        </div>

        {/* Storage Quota Metric */}
        <div
          onClick={() => onNavigate('settings')}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-800/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bộ nhớ đã dùng
            </span>
            <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white">
            {formatBytes(stats.estimatedBytesUsed)}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${Math.max(4, usedPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recent Photos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-sky-400" />
              <span>Ảnh chụp gần đây</span>
            </h3>
            <p className="text-xs text-slate-400">
              Ảnh mới nhất được lưu trong IndexedDB
            </p>
          </div>
          <button
            onClick={() => onNavigate('gallery')}
            className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            <span>Xem tất cả ({stats.photoCount})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <Camera className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">
              Chưa có ảnh nào được chụp
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Mở camera hiện trường để chụp ảnh và tự động đóng dấu ngày giờ, địa chỉ công trình.
            </p>
            <button
              onClick={() => onNavigate('camera')}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Mở máy ảnh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {recentPhotos.map((photo) => {
              const proj = projects.find((p) => p.id === photo.projectId);
              return (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  project={proj}
                  onClick={onOpenPhotoDetail}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Active Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-amber-400" />
              <span>Danh sách công trình thi công</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quản lý hồ sơ công trình và hạng mục thi công
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewProject}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 text-sky-400" />
              <span>Thêm công trình</span>
            </button>

            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 ml-2"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((proj) => (
            <div
              key={proj.id}
              onClick={() => onNavigate('projectDetail', { projectId: proj.id })}
              className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-md bg-sky-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-400 border border-sky-800">
                    {proj.code}
                  </span>
                  <h4 className="mt-2 font-bold text-white text-base">
                    {proj.name}
                  </h4>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                    proj.status === 'in_progress'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                      : proj.status === 'completed'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {proj.status === 'in_progress'
                    ? 'Đang thi công'
                    : proj.status === 'completed'
                    ? 'Hoàn thành'
                    : proj.status === 'planning'
                    ? 'Chuẩn bị'
                    : 'Tạm dừng'}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                {proj.address || 'Chưa cập nhật địa chỉ'}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                <span>Nhà thầu: {proj.contractor || 'N/A'}</span>
                <span className="font-semibold text-sky-400">Chi tiết &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
