import React from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Hash,
  Download,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export const HelpPrivacyPage: React.FC = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <HelpCircle className="h-6 w-6 text-sky-400" />
          <span>Trợ giúp & Chính sách Quyền riêng tư</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Cam kết bảo mật dữ liệu, hướng dẫn cài đặt PWA và đóng gói ứng dụng di động
        </p>
      </div>

      {/* Local-first Privacy Pledge */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-6 space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span>Cam kết Bảo mật & Kiến trúc Cục bộ (Local-First)</span>
        </h3>
        <p className="text-slate-200">
          Ứng dụng <strong>TimeSnap Construction Pro</strong> được thiết kế theo tôn chỉ bảo vệ dữ liệu công trình của bạn:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
          <li>
            <strong>Không yêu cầu tài khoản:</strong> Bạn có thể sử dụng đầy đủ mọi tính năng mà không cần đăng ký hay cung cấp thông tin cá nhân.
          </li>
          <li>
            <strong>Không tự ý gửi dữ liệu lên Cloud:</strong> Tất cả hình ảnh, tọa độ GPS và thông tin công trình được lưu trữ bền vững bên trong IndexedDB của thiết bị của bạn.
          </li>
          <li>
            <strong>Không thu thập dữ liệu hành vi:</strong> Không gắn mã theo dõi (analytics) hay quảng cáo từ bên thứ ba.
          </li>
          <li>
            <strong>Quyền Camera và GPS minh bạch:</strong> Ứng dụng chỉ xin quyền khi bạn mở màn hình chụp ảnh. Nếu bạn từ chối quyền, bạn vẫn có thể nhập ảnh và gõ tọa độ thủ công.
          </li>
        </ul>
      </div>

      {/* SHA-256 Explanation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Hash className="h-5 w-5 text-amber-400" />
          <span>Giải thích về Mã băm toàn vẹn (SHA-256 Integrity Hash)</span>
        </h3>
        <p className="text-slate-300">
          Mỗi bức ảnh sau khi đóng dấu sẽ được tính toán một chuỗi mã băm mã hóa SHA-256 (256-bit).
        </p>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
          <p className="font-semibold">Lưu ý quan trọng:</p>
          <p className="mt-1">
            Mã băm SHA-256 chứng minh tệp ảnh không bị biến đổi sau khi xuất ảnh. Tuy nhiên, mã băm này không tự chứng minh thời gian hoặc vị trí chụp là thật nếu thiếu cơ quan chứng thực độc lập. Người dùng được toàn quyền tùy chỉnh ngày giờ và GPS theo yêu cầu công việc hiện trường, nhưng ứng dụng không tuyên bố dữ liệu tùy chỉnh là dữ liệu được bên thứ ba bảo chứng pháp lý.
          </p>
        </div>
      </div>

      {/* PWA Installation Instructions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-emerald-400" />
          <span>Hướng dẫn Cài đặt Ứng dụng PWA (Màn hình chính)</span>
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* iOS Safari */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Trên iPhone / iPad (Safari)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Mở trình duyệt <strong>Safari</strong> và truy cập ứng dụng.</li>
              <li>Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới.</li>
              <li>Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</li>
              <li>Nhấn <strong>Thêm (Add)</strong>. Ứng dụng sẽ xuất hiện như app native.</li>
            </ol>
          </div>

          {/* Android Chrome */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Trên Android (Google Chrome)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-300">
              <li>Mở trình duyệt <strong>Google Chrome</strong>.</li>
              <li>Nhấn vào menu <strong>3 dấu chấm (⋮)</strong> góc trên cùng bên phải.</li>
              <li>Chọn <strong>Cài đặt ứng dụng (Install App)</strong> hoặc <strong>Thêm vào màn hình chính</strong>.</li>
              <li>Xác nhận để hoàn tất cài đặt.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Native App Packaging Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-indigo-400" />
          <span>Đóng gói Native Android (APK/AAB) & iOS với Capacitor</span>
        </h3>
        <p className="text-slate-300">
          Mã nguồn dự án đã tích hợp sẵn Capacitor 7. Bạn có thể dễ dàng đồng bộ và build ra file cài đặt native:
        </p>
        <div className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-sky-300 space-y-1 border border-slate-800">
          <p># 1. Build web bundle:</p>
          <p className="text-white">npm run build</p>
          <p className="pt-1"># 2. Thêm và đồng bộ Android:</p>
          <p className="text-white">npx cap add android</p>
          <p className="text-white">npx cap sync</p>
          <p className="pt-1"># 3. Mở Android Studio để build APK:</p>
          <p className="text-white">npx cap open android</p>
        </div>
      </div>
    </div>
  );
};
