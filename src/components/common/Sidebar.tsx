import React from 'react';
import {
  Home,
  FolderKanban,
  Camera,
  Image as ImageIcon,
  Stamp,
  FileText,
  HardDriveDownload,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const mainLinks = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'projects', label: 'Quản lý Công trình', icon: FolderKanban },
    { id: 'camera', label: 'Máy ảnh Hiện trường', icon: Camera, highlight: true },
    { id: 'gallery', label: 'Thư viện Ảnh', icon: ImageIcon },
    { id: 'templates', label: 'Mẫu Đóng dấu', icon: Stamp },
    { id: 'reports', label: 'Báo cáo & PDF', icon: FileText },
  ];

  const secondaryLinks = [
    { id: 'backup', label: 'Sao lưu & Khôi phục', icon: HardDriveDownload },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
    { id: 'help', label: 'Trợ giúp & Quyền riêng tư', icon: HelpCircle },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-slate-800 bg-slate-900/60 p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Chức năng chính
          </p>
          <div className="mt-2 space-y-1">
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30'
                      : item.highlight
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sky-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hệ thống & Dữ liệu
          </p>
          <div className="mt-2 space-y-1">
            {secondaryLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 shadow-sm border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
        <div className="flex items-center justify-between font-semibold text-slate-300">
          <span>Local-First</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">100% Cục bộ</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed">
          Ảnh và GPS lưu trữ an toàn trên thiết bị của bạn. Không đồng bộ đám mây trái phép.
        </p>
      </div>
    </aside>
  );
};
