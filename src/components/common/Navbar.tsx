import React from 'react';
import { Camera, HardHat, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../hooks/useTheme';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const isOnline = useOnlineStatus();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
      <div
        className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
        onClick={() => onNavigate('dashboard')}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-amber-500 shadow-md shadow-sky-950">
          <HardHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base sm:text-lg">
            <span>TimeSnap</span>
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-sky-400">
              PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Chụp ảnh & Đóng dấu công trình chuyên nghiệp
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Online / Offline status badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
          title={isOnline ? 'Đang trực tuyến' : 'Chế độ Ngoại tuyến (Offline-ready)'}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Trực tuyến</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Quick Capture Button */}
        {currentPage !== 'camera' && (
          <button
            onClick={() => onNavigate('camera')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-sky-600/30 transition-all hover:brightness-110 active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Chụp ngay</span>
          </button>
        )}
      </div>
    </header>
  );
};
