import jsPDF from 'jspdf';
import { Project, ReportRecord, PhotoRecord } from '../../models';
import { getPhotoBlob } from '../../storage/blobStorage';
import { loadImageElement } from '../image/exifUtils';
import { formatDateTime } from '../image/stampEngine';

export interface GenerateReportPdfOptions {
  report: ReportRecord;
  project?: Project;
  photos: {
    record: PhotoRecord;
    caption: string;
    order: number;
  }[];
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  daily: 'BÁO CÁO CÔNG VIỆC HẰNG NGÀY',
  progress: 'BÁO CÁO TIẾN ĐỘ THI CÔNG',
  inspection: 'BÁO CÁO KIỂM TRA HIỆN TRƯỜNG',
  safety: 'BÁO CÁO AN TOÀN LAO ĐỘNG (HSE)',
  defect: 'BÁO CÁO LỖI VÀ BIỆN PHÁP KHẮC PHỤC',
  acceptance: 'BIÊN BẢN NGHIỆM THU HIỆN TRƯỜNG',
  incident: 'BÁO CÁO SỰ CỐ CÔNG TRÌNH',
  custom: 'BÁO CÁO KỸ THUẬT CÔNG TRƯỜNG',
};

/**
 * Creates high-fidelity PDF report by rendering A4 pages to high-resolution 300DPI
 * Canvas context with perfect Vietnamese typography, then assembling with jsPDF.
 */
export async function generateReportPdf(options: GenerateReportPdfOptions): Promise<Blob> {
  const { report, project, photos } = options;

  // A4 dimensions at 150 DPI for crisp print quality and reasonable file size
  // A4 = 210mm x 297mm = 1240px x 1754px at 150 DPI
  const PAGE_WIDTH = 1240;
  const PAGE_HEIGHT = 1754;
  const MARGIN = 60;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Preload photo images
  const loadedPhotos: {
    img: HTMLImageElement;
    caption: string;
    record: PhotoRecord;
  }[] = [];

  for (const item of photos) {
    const blob = await getPhotoBlob(item.record.stampedPhotoBlobId);
    if (blob) {
      try {
        const img = await loadImageElement(blob);
        loadedPhotos.push({
          img,
          caption: item.caption,
          record: item.record,
        });
      } catch (e) {
        console.warn('Failed to load image for PDF:', e);
      }
    }
  }

  // Calculate layout chunks based on layoutColumns
  const photosPerPage = report.layoutColumns === 1 ? 2 : report.layoutColumns === 2 ? 4 : 6;
  const photoPagesCount = Math.max(1, Math.ceil(loadedPhotos.length / photosPerPage));
  const totalPages = 1 + (loadedPhotos.length > 2 ? photoPagesCount : 0); // If few photos, fit on 1-2 pages

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentPageNumber = 1;

  // Helper to create blank A4 canvas
  const createPageCanvas = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_WIDTH;
    canvas.height = PAGE_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    return { canvas, ctx };
  };

  // Helper to draw common header and footer on any page canvas
  const drawHeaderAndFooter = (
    ctx: CanvasRenderingContext2D,
    page: number,
    total: number
  ) => {
    // Header line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(MARGIN, 50);
    ctx.lineTo(PAGE_WIDTH - MARGIN, 50);
    ctx.stroke();

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('TIMESNAP CONSTRUCTION PRO — BÁO CÁO HIỆN TRƯỜNG', MARGIN, 42);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(`Mã BC: ${report.reportCode}`, PAGE_WIDTH - MARGIN, 42);
    ctx.textAlign = 'left';

    // Footer line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, PAGE_HEIGHT - 45);
    ctx.lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 45);
    ctx.stroke();

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Báo cáo tạo tự động từ ứng dụng TimeSnap Construction Pro (Local-first)', MARGIN, PAGE_HEIGHT - 28);

    ctx.textAlign = 'right';
    ctx.fillText(`Trang ${page} / ${total}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 28);
    ctx.textAlign = 'left';
  };

  // ---------------- PAGE 1: REPORT DETAILS & FIRST PHOTOS ----------------
  const { canvas: page1Canvas, ctx: p1 } = createPageCanvas();
  let y = 90;

  // Draw Title
  p1.font = 'bold 28px sans-serif';
  p1.fillStyle = '#0f172a';
  p1.textAlign = 'center';
  const titleText = REPORT_TYPE_LABELS[report.reportType] || 'BÁO CÁO CÔNG TRÌNH';
  p1.fillText(titleText, PAGE_WIDTH / 2, y);
  y += 35;

  p1.font = 'italic 16px sans-serif';
  p1.fillStyle = '#475569';
  p1.fillText(`Tiêu đề: ${report.title}`, PAGE_WIDTH / 2, y);
  p1.textAlign = 'left';
  y += 30;

  // Metadata Card
  p1.fillStyle = '#f8fafc';
  p1.strokeStyle = '#cbd5e1';
  p1.lineWidth = 1;
  p1.beginPath();
  p1.roundRect(MARGIN, y, CONTENT_WIDTH, 140, 8);
  p1.fill();
  p1.stroke();

  // Project Info Text inside Card
  p1.font = 'bold 15px sans-serif';
  p1.fillStyle = '#1e293b';
  p1.fillText(`DỰ ÁN:`, MARGIN + 20, y + 30);
  p1.font = '15px sans-serif';
  p1.fillText(`${project?.name || 'Chưa liên kết'} (${project?.code || 'N/A'})`, MARGIN + 120, y + 30);

  p1.font = 'bold 15px sans-serif';
  p1.fillText(`ĐỊA CHỈ:`, MARGIN + 20, y + 60);
  p1.font = '15px sans-serif';
  p1.fillText(`${project?.address || 'Tại hiện trường'}`, MARGIN + 120, y + 60);

  p1.font = 'bold 15px sans-serif';
  p1.fillText(`NHÀ THẦU:`, MARGIN + 20, y + 90);
  p1.font = '15px sans-serif';
  p1.fillText(`${project?.contractor || 'Tổng thầu thi công'}`, MARGIN + 120, y + 90);

  p1.font = 'bold 15px sans-serif';
  p1.fillText(`NGÀY LẬP:`, MARGIN + 20, y + 120);
  p1.font = '15px sans-serif';
  p1.fillText(`${formatDateTime(report.reportDate, 'DD/MM/YYYY', '24h', false)}  |  Người lập: ${report.author}`, MARGIN + 120, y + 120);

  y += 165;

  // Work content section
  p1.font = 'bold 17px sans-serif';
  p1.fillStyle = '#0369a1';
  p1.fillText('1. NỘI DUNG THI CÔNG & HIỆN TRƯỜNG', MARGIN, y);
  y += 25;

  p1.font = '15px sans-serif';
  p1.fillStyle = '#1e293b';
  // Simple multi-line text wrapper
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = (text || '').split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current + (current ? ' ' : '') + w;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const contentLines = wrapText(p1, report.workContent || 'Không có mô tả chi tiết.', CONTENT_WIDTH);
  for (const line of contentLines) {
    p1.fillText(line, MARGIN, y);
    y += 22;
  }
  y += 10;

  // Issues and Recommendations if present
  if (report.issuesToResolve || report.recommendations) {
    if (report.issuesToResolve) {
      p1.font = 'bold 16px sans-serif';
      p1.fillStyle = '#b91c1c';
      p1.fillText('Vấn đề cần xử lý:', MARGIN, y);
      y += 22;
      p1.font = '15px sans-serif';
      p1.fillStyle = '#334155';
      const issueLines = wrapText(p1, report.issuesToResolve, CONTENT_WIDTH);
      for (const line of issueLines) {
        p1.fillText(line, MARGIN, y);
        y += 22;
      }
      y += 8;
    }

    if (report.recommendations) {
      p1.font = 'bold 16px sans-serif';
      p1.fillStyle = '#0369a1';
      p1.fillText('Kiến nghị & giải pháp:', MARGIN, y);
      y += 22;
      p1.font = '15px sans-serif';
      p1.fillStyle = '#334155';
      const recLines = wrapText(p1, report.recommendations, CONTENT_WIDTH);
      for (const line of recLines) {
        p1.fillText(line, MARGIN, y);
        y += 22;
      }
      y += 8;
    }
  }

  // Draw photo grid section
  p1.font = 'bold 17px sans-serif';
  p1.fillStyle = '#0369a1';
  p1.fillText(`2. HÌNH ẢNH MINH CHỨNG HIỆN TRƯỜNG (${loadedPhotos.length} ảnh)`, MARGIN, y);
  y += 25;

  // Check how many photos fit on Page 1
  const remainingHeightPage1 = PAGE_HEIGHT - y - 180; // reserve space for signatures
  let photoIndex = 0;

  // Function to render a photo card on a given canvas
  const drawPhotoCard = (
    ctx: CanvasRenderingContext2D,
    item: { img: HTMLImageElement; caption: string; record: PhotoRecord },
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number
  ) => {
    // Border card
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Image fit
    const imgH = boxH - 45;
    const imgW = boxW - 12;
    ctx.drawImage(item.img, boxX + 6, boxY + 6, imgW, imgH);

    // Caption bar
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#0f172a';
    const cap = item.caption || item.record.title || 'Ảnh hiện trường';
    ctx.fillText(cap.slice(0, 45), boxX + 10, boxY + boxH - 24);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    const sub = `${formatDateTime(item.record.displayDateTime, 'DD/MM/YYYY', '24h', false)}  |  #${item.record.id.slice(0, 8)}`;
    ctx.fillText(sub, boxX + 10, boxY + boxH - 10);
  };

  // Layout photos across pages
  const cols = report.layoutColumns || 2;
  const colGap = 20;
  const cardWidth = (CONTENT_WIDTH - (cols - 1) * colGap) / cols;
  const cardHeight = cols === 1 ? 400 : cols === 2 ? 300 : 220;

  // Draw Page 1 photos if space permits
  if (remainingHeightPage1 >= cardHeight && loadedPhotos.length > 0) {
    const rowY = y;
    for (let c = 0; c < cols && photoIndex < loadedPhotos.length; c++) {
      const pX = MARGIN + c * (cardWidth + colGap);
      drawPhotoCard(p1, loadedPhotos[photoIndex], pX, rowY, cardWidth, cardHeight);
      photoIndex++;
    }
    y += cardHeight + 25;
  }

  // Draw signature block at the bottom of Page 1 (if all photos fit) or on the last page
  const drawSignatureBlock = (ctx: CanvasRenderingContext2D, startY: number) => {
    const sigY = Math.min(startY, PAGE_HEIGHT - 170);
    const colW = CONTENT_WIDTH / 3;

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';

    // 3 signature columns
    ctx.fillText('NGƯỜI LẬP BÁO CÁO', MARGIN + colW * 0.5, sigY);
    ctx.fillText('CÁN BỘ GIÁM SÁT', MARGIN + colW * 1.5, sigY);
    ctx.fillText('CHỈ HUY TRƯỞNG', MARGIN + colW * 2.5, sigY);

    ctx.font = 'italic 13px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('(Ký & ghi rõ họ tên)', MARGIN + colW * 0.5, sigY + 22);
    ctx.fillText('(Ký & ghi rõ họ tên)', MARGIN + colW * 1.5, sigY + 22);
    ctx.fillText('(Ký & ghi rõ họ tên)', MARGIN + colW * 2.5, sigY + 22);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(report.signatureInfo.preparedBy || report.author, MARGIN + colW * 0.5, sigY + 95);
    if (report.signatureInfo.reviewedBy) {
      ctx.fillText(report.signatureInfo.reviewedBy, MARGIN + colW * 1.5, sigY + 95);
    }
    if (report.signatureInfo.approvedBy) {
      ctx.fillText(report.signatureInfo.approvedBy, MARGIN + colW * 2.5, sigY + 95);
    }
    ctx.textAlign = 'left';
  };

  const pagesCanvases: HTMLCanvasElement[] = [page1Canvas];

  // If there are still photos, create page 2+
  while (photoIndex < loadedPhotos.length) {
    const { canvas: nextCanvas, ctx: nextCtx } = createPageCanvas();
    let nextY = 80;

    nextCtx.font = 'bold 18px sans-serif';
    nextCtx.fillStyle = '#0369a1';
    nextCtx.fillText(`HÌNH ẢNH MINH CHỨNG (Tiếp theo)`, MARGIN, nextY);
    nextY += 30;

    const maxRows = cols === 1 ? 2 : cols === 2 ? 3 : 4;
    for (let r = 0; r < maxRows && photoIndex < loadedPhotos.length; r++) {
      for (let c = 0; c < cols && photoIndex < loadedPhotos.length; c++) {
        const pX = MARGIN + c * (cardWidth + colGap);
        drawPhotoCard(nextCtx, loadedPhotos[photoIndex], pX, nextY, cardWidth, cardHeight);
        photoIndex++;
      }
      nextY += cardHeight + 20;
    }

    pagesCanvases.push(nextCanvas);
  }

  // Draw signatures on the last page
  const lastIndex = pagesCanvases.length - 1;
  const lastCanvas = pagesCanvases[lastIndex];
  const lastCtx = lastCanvas.getContext('2d')!;
  drawSignatureBlock(lastCtx, PAGE_HEIGHT - 160);

  // Draw header and footer on all canvases with accurate total count
  const finalTotalPages = pagesCanvases.length;
  pagesCanvases.forEach((c, idx) => {
    const ctx = c.getContext('2d')!;
    drawHeaderAndFooter(ctx, idx + 1, finalTotalPages);
  });

  // Assemble into jsPDF document
  pagesCanvases.forEach((c, idx) => {
    if (idx > 0) pdf.addPage('a4', 'portrait');
    const imgData = c.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  return pdf.output('blob');
}
