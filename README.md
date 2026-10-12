# TimeSnap Construction Pro — Ứng Dụng Chụp Ảnh Công Trình Chuyên Nghiệp

![TimeSnap Pro Banner](public/favicon.svg)

**TimeSnap Construction Pro** là ứng dụng chuyên biệt phục vụ chụp ảnh hiện trường, theo dõi tiến độ thi công, kiểm tra chất lượng (KCS), giám sát an toàn lao động (HSE) và lập báo cáo nghiệm thu công trình xây dựng. 

Ứng dụng lấy cảm hứng từ chức năng đóng dấu ngày giờ, địa chỉ và GPS của Timestamp Camera / Timemark nhưng được phát triển với thương hiệu riêng, thiết kế SaaS cao cấp và kiến trúc **Local-First (100% Cục bộ)** — không phụ thuộc máy chủ, bảo mật tuyệt đối ảnh hiện trường.

---

## I. TÍNH NĂNG NỔI BẬT

### 1. Camera Hiện Trường Chuyên Dụng
- Mở camera trực tiếp, hỗ trợ ưu tiên camera sau trên điện thoại.
- Đổi camera trước/sau linh hoạt.
- Bật/tắt đèn Flash / Torch trực tiếp trên các thiết bị hỗ trợ.
- Tùy chọn hẹn giờ chụp (3s, 5s, 10s) với âm thanh đếm ngược và hiệu ứng thị giác.
- Hỗ trợ các mức độ phân giải: **Full HD (1080p)**, **4K**, và **HD (720p)**.
- Cho phép **tải ảnh lên từ thư viện thiết bị** kèm trích xuất thời gian.
- Nút chụp ảnh lớn, tối ưu thao tác bằng một tay ngoài công trường.

### 2. Đóng Dấu Pixel Trực Tiếp (Canvas Stamping Engine)
- Thông tin dấu được vẽ trực tiếp vào từng pixel của ảnh xuất ra (Canvas API), không phải chỉ là lớp chữ hiển thị trên giao diện.
- Tự động co giãn tỷ lệ font chữ, độ đệm và viền theo độ phân giải gốc của ảnh (High DPI scaling) để dấu không bao giờ bị vỡ hạt hay lệch tỷ lệ.
- Tự động ngắt dòng thông minh (word-wrapping) khi địa chỉ hoặc ghi chú dài, đảm bảo không tràn ra ngoài viền ảnh.
- Tùy chọn lưu kèm bản **ảnh gốc sạch (clean photo)** giúp tái tạo và chỉnh sửa lại dấu bất kỳ lúc nào mà không bị đè dấu cũ.

### 3. Tùy Chỉnh Toàn Diện Ngày Giờ, GPS & Địa Chỉ
- **Ngày giờ:** Tự động lấy giờ chụp từ thiết bị hoặc tùy chỉnh thủ công; hỗ trợ định dạng DD/MM/YYYY, YYYY-MM-DD, 24 giờ / 12 giờ AM-PM.
- **Tọa độ GPS:** Lấy tọa độ thật từ phần cứng thiết bị hoặc nhập vĩ độ/kinh độ thủ công. Có kiểm tra tính hợp lệ (-90 đến 90 và -180 đến 180).
- **Địa chỉ:** Tự động Reverse Geocoding (OpenStreetMap) khi có mạng hoặc nhập/sửa địa chỉ tiếng Việt thủ công. Địa chỉ người dùng nhập không bao giờ bị ghi đè.
- **Phân biệt minh bạch nguồn dữ liệu:** Hiển thị rõ ràng nhãn `[Thiết bị]`, `[Tùy chỉnh]` hoặc `[Điều chỉnh]`, bảo đảm tính trung thực kỹ thuật.
- **Tính toán mã băm SHA-256:** Tính toán mã băm toàn vẹn cho từng tệp ảnh đã đóng dấu kèm giải thích rõ ràng về mặt kỹ thuật.

### 4. 8 Mẫu Đóng Dấu Sẵn Có (Stamp Presets) & Bộ Tùy Chỉnh Mẫu
1. **Tiêu chuẩn:** Phù hợp cho hầu hết các công tác hiện trường hằng ngày.
2. **Công trường thi công:** Độ tương phản cao với chữ vàng hổ phách ngoài trời nắng gắt.
3. **Báo cáo tiến độ:** Tông xanh đậm thanh lịch cho báo cáo chủ đầu tư.
4. **Kiểm tra chất lượng (KCS):** Nhấn mạnh tiêu chuẩn chất lượng và mã băm toàn vẹn.
5. **An toàn lao động (HSE):** Viền đỏ cảnh báo nổi bật cho giám sát an toàn.
6. **Nghiệm thu bàn giao:** Đầy đủ thông tin pháp lý, độ chính xác GPS 6 chữ số thập phân.
7. **Tọa độ GPS chi tiết:** Font monospace chuyên dụng cho đo đạc trắc địa.
8. **Doanh nghiệp có Logo:** Đóng dấu dạng thanh ngang chân trang thương hiệu.

### 5. Quản Lý Công Trình & Hạng Mục
- Tạo, sửa, lọc trạng thái (*Chuẩn bị, Đang thi công, Tạm dừng, Hoàn thành, Lưu trữ*) và xóa công trình.
- Quản lý danh mục hạng mục tiêu chuẩn: *Móng, Cốt thép, Cốp pha, Bê tông, Kết cấu thép, Xây tô, Điện nước (MEP), Hoàn thiện, An toàn lao động (HSE), Kiểm tra chất lượng (KCS), Nghiệm thu*.
- Cho phép người dùng tự tạo thêm các hạng mục công việc riêng.

### 6. Thư Viện Ảnh Cục Bộ & Thao Tác Hàng Loạt
- Tìm kiếm tức thì theo tên công trình, hạng mục, ghi chú, địa chỉ.
- Lọc theo ngày tháng (khoảng ngày bắt đầu - kết thúc) và sắp xếp mới nhất/cũ nhất.
- Chế độ chọn nhiều ảnh (Multi-select):
  - **Tải ảnh hàng loạt dạng ZIP**.
  - **Cộng/trừ thời gian hàng loạt** (+/- phút, giờ, ngày) cho nhiều ảnh cùng lúc.
  - **Xóa ảnh hàng loạt** an toàn với hộp thoại xác nhận.
- Xem chi tiết ảnh với bộ phóng to (Zoom In/Out), so sánh ảnh đóng dấu vs ảnh gốc sạch.
- Chức năng **Chỉnh sửa dấu ảnh đã lưu (Re-stamp)**: tái kết xuất dấu trực tiếp từ ảnh gốc sạch.

### 7. Xuất Báo Cáo Hiện Trường PDF Chuyên Nghiệp
- Hỗ trợ nhiều loại báo cáo: *Báo cáo hằng ngày, Tiến độ, Kiểm tra, An toàn HSE, Nghiệm thu, Sự cố*.
- Tùy chọn bố cục ảnh: **1 ảnh/hàng** (khổ lớn chi tiết), **2 ảnh/hàng** (chuẩn cân đối) hoặc **4 ảnh/hàng** (lưới thu nhỏ).
- Nhúng ảnh đã đóng dấu, mã ảnh, GPS, thời gian và chú thích riêng cho từng ảnh.
- Hỗ trợ đầy đủ **font chữ tiếng Việt có dấu** không bị lỗi font hay vỡ bố cục.
- Khung chữ ký chính thức: *Người lập, Cán bộ giám sát, Chỉ huy trưởng*.
- Xem trước trực tiếp trong app, in ấn và tải file PDF về thiết bị.

### 8. Sao Lưu & Khôi Phục Độc Lập (Backup / Restore)
- Đóng gói toàn bộ cơ sở dữ liệu + hình ảnh thành tệp `.ZIP` chuẩn.
- Tùy chọn xuất toàn bộ ứng dụng hoặc xuất riêng theo từng công trình.
- Cơ chế giải nén an toàn: kiểm tra manifest, chống Zip-bomb và chống tấn công đường dẫn file.
- Tùy chọn xử lý trùng lặp: *Bỏ qua dữ liệu trùng* hoặc *Ghi đè dữ liệu trùng*.

---

## II. KIẾN TRÚC & CÔNG NGHỆ

- **Ngôn ngữ & Nền tảng:** React 19, TypeScript, Vite.
- **Giao diện & Thẩm mỹ:** Tailwind CSS (Theme Navy/Slate cao cấp, hỗ trợ Dark/Light mode).
- **Bộ biểu tượng:** Lucide React.
- **Lưu trữ Cục bộ (Local-First Storage):** IndexedDB qua Dexie.js (lưu metadata và Binary Blobs dung lượng cao).
- **Xử lý ảnh:** HTML5 Canvas API với tỷ lệ thích ứng độ phân giải cao và tính toàn vẹn SHA-256 (SubtleCrypto API).
- **Xuất PDF:** jsPDF kết hợp high-resolution canvas layout hỗ trợ tiếng Việt.
- **Nén & Đóng gói:** JSZip, FileSaver.
- **Tích hợp Native Mobile:** Capacitor Core, Capacitor Camera, Capacitor Geolocation, Capacitor Filesystem.

---

## III. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### 1. Yêu Cầu Môi Trường
- Node.js version 18 trở lên (khuyên dùng Node.js 20+).
- npm 9+ hoặc pnpm/yarn.

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Chạy Môi Trường Phát Triển (Development)
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`.

### 4. Chạy Kiểm Thử Tự Động (Unit Tests)
```bash
npm test
```

### 5. Build Bản Sản Phẩm (Production Web / PWA)
```bash
npm run build
```
Kết quả build được lưu trong thư mục `dist/`.

Để xem trước bản build:
```bash
npm run preview
```

---

## IV. TRIỂN KHAI WEB & PWA (PROGRESSIVE WEB APP)

### 1. Deploy Lên Cloudflare Pages / Vercel / Netlify
- Thư mục build: `dist`
- Lệnh build: `npm run build`
- Hỗ trợ SPA Routing: Thêm cấu hình rewrite về `/index.html` cho tất cả đường dẫn tĩnh.

### 2. Cài Đặt PWA Trên Thiết Bị Di Động
- **Trên iPhone / iPad (Safari):**
  1. Mở trang web qua trình duyệt Safari.
  2. Bấm vào nút **Chia sẻ (Share)** ở thanh công cụ dưới cùng.
  3. Chọn **Thêm vào MH chính (Add to Home Screen)**.
  4. Ứng dụng sẽ hoạt động toàn màn hình như ứng dụng native.
- **Trên Android (Chrome):**
  1. Mở trang web qua trình duyệt Chrome.
  2. Nhấn nút menu **3 chấm (⋮)** ở góc trên.
  3. Chọn **Cài đặt ứng dụng (Install app)**.

---

## V. ĐÓNG GÓI ỨNG DỤNG ANDROID & IOS VỚI CAPACITOR

Dự án đã có cấu hình `capacitor.config.ts` với Application ID: `com.timesnap.constructionpro`.

### 1. Đóng Gói Android (APK / AAB)
```bash
# 1. Build mã nguồn web
npm run build

# 2. Thêm nền tảng Android (chỉ cần chạy lần đầu)
npx cap add android

# 3. Đồng bộ mã nguồn và plugin vào thư mục android
npx cap sync android

# 4. Mở dự án trong Android Studio
npx cap open android
```
Trong **Android Studio**:
- Vào menu **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** để xuất file APK cài đặt trực tiếp.
- Hoặc chọn **Generate Signed Bundle / APK** để tạo file `.aab` phát hành lên Google Play Store.

*Lưu ý quyền Android (`android/app/src/main/AndroidManifest.xml`):*
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 2. Đóng Gói iOS (iPhone / iPad)
> **Lưu ý:** Việc build ứng dụng iOS native bắt buộc phải thực hiện trên máy tính macOS có cài đặt Xcode.

```bash
# 1. Build mã nguồn web
npm run build

# 2. Thêm nền tảng iOS (chạy trên macOS)
npx cap add ios

# 3. Đồng bộ mã nguồn
npx cap sync ios

# 4. Mở trong Xcode
npx cap open ios
```
Trong **Xcode**:
- Cấu hình Signing & Capabilities với tài khoản Apple Developer.
- Thêm quyền trong `Info.plist`:
  - `NSCameraUsageDescription`: *"Ứng dụng cần quyền camera để chụp ảnh hiện trường công trình."*
  - `NSLocationWhenInUseUsageDescription`: *"Ứng dụng cần quyền vị trí để đóng dấu tọa độ GPS và địa chỉ lên ảnh công trình."*
- Chọn thiết bị thật hoặc Simulator để chạy thử và Archive ứng dụng lên TestFlight / App Store.

---

## VI. CHECKLIST KIỂM THỬ TRÊN THIẾT BỊ THỰC TẾ

| Hạng mục kiểm tra | Thiết bị test | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Quyền Camera** | Android / iPhone | Hiển thị hộp thoại xin quyền; khi đồng ý camera mở luồng video mượt mà. |
| **Đổi Camera & Flash** | Điện thoại di động | Chuyển đổi qua lại giữa camera trước/sau; nút bật Flash sáng đèn flash sau. |
| **Đóng dấu Ngày giờ & GPS** | Hiện trường có GPS | Lấy được tọa độ GPS và địa chỉ tự động; dấu in trực tiếp vào pixel ảnh. |
| **Chế độ Ngoại tuyến (Offline)** | Tắt Wifi & 4G | Ứng dụng vẫn mở bình thường, chụp ảnh, lưu IndexedDB, nhập GPS thủ công và tạo báo cáo PDF mà không lỗi. |
| **Chỉnh sửa dấu ảnh đã lưu** | Trình duyệt / App | Mở ảnh cũ từ thư viện, sửa giờ/địa chỉ và áp dụng lại; ảnh tạo lại từ bản gốc sạch không bị chồng dấu. |
| **Xuất Báo Cáo PDF** | Máy tính / Điện thoại | File PDF tạo thành công với ảnh đính kèm, bảng chữ ký và hiển thị đúng tiếng Việt có dấu. |
| **Sao lưu & Khôi phục ZIP** | Trình duyệt / App | Tải về file `.zip` chứa ảnh + database; nhập lại trên thiết bị khác khôi phục đầy đủ dữ liệu. |

---

## VII. BẢN QUYỀN & GIẤY PHÉP

Dự án được xây dựng phục vụ ngành kỹ thuật xây dựng và quản lý dự án công trình.
Phát triển với triết lý **Bảo mật — Độc lập — Minh bạch dữ liệu hiện trường**.
