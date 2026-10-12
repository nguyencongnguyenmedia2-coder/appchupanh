import React from 'react';
import { Home, Stamp, Camera, Image as ImageIcon, FileText } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'gallery', label: 'Thư viện', icon: ImageIcon },
    { id: 'camera', label: 'Chụp ảnh', icon: Camera, isCenter: true },
    { id: 'templates', label: 'Mẫu dấu', icon: Stamp },
    { id: 'reports', label: 'Báo cáo', icon: FileText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group relative -top-3 flex flex-col items-center focus:outline-none"
              >
                <div
                  className={`flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-amber-500/40'
                      : 'bg-gradient-to-tr from-sky-500 to-sky-600 text-white shadow-sky-500/40 hover:scale-105'
                  }`}
                >
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span className="mt-1 text-[10px] font-bold text-sky-400">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
              <span className={`mt-1 text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
