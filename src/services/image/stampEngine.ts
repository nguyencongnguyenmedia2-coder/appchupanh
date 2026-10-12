import { StampTemplate } from '../../models';
import { loadImageElement } from './exifUtils';
import { calculateSha256 } from './hashUtils';

export interface StampRenderMetadata {
  displayDateTime: string;
  dateTimeSource: 'device' | 'manual' | 'adjusted';
  gps: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
  } | null;
  gpsSource: 'device' | 'manual' | 'none';
  address: string;
  addressSource: 'geocoded' | 'manual' | 'none';
  projectName?: string;
  projectCode?: string;
  workItemName?: string;
  author: string;
  contractor?: string;
  notes?: string;
  photoId: string;
  sha256Hash?: string;
}

export interface StampEngineOutput {
  stampedBlob: Blob;
  thumbnailBlob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  sha256Hash: string;
}

export function formatDateTime(
  isoOrString: string,
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' = 'DD/MM/YYYY',
  timeFormat: '24h' | '12h' = '24h',
  showSeconds: boolean = true
): string {
  try {
    const d = new Date(isoOrString);
    if (isNaN(d.getTime())) return isoOrString;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    let dateStr = '';
    if (dateFormat === 'YYYY-MM-DD') {
      dateStr = `${year}-${month}-${day}`;
    } else if (dateFormat === 'MM/DD/YYYY') {
      dateStr = `${month}/${day}/${year}`;
    } else {
      dateStr = `${day}/${month}/${year}`;
    }

    let hours = d.getHours();
    let ampm = '';
    if (timeFormat === '12h') {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    const hStr = pad(hours);
    const mStr = pad(d.getMinutes());
    const sStr = pad(d.getSeconds());

    const timeStr = showSeconds
      ? `${hStr}:${mStr}:${sStr}${ampm}`
      : `${hStr}:${mStr}${ampm}`;

    return `${dateStr}  ${timeStr}`;
  } catch {
    return isoOrString;
  }
}

/**
 * Draws the stamp card or banner directly onto the provided 2D Canvas context.
 */
export async function renderStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  meta: StampRenderMetadata,
  template: StampTemplate
): Promise<void> {
  // Proportional scale factor relative to a standard 1920px image
  const baseWidth = 1920;
  const scale = Math.max(0.6, Math.min(2.5, width / baseWidth));
  const baseFontSize = template.fontSize * scale;
  const lineHeight = baseFontSize * (template.lineHeight || 1.35);
  const padding = 20 * scale;
  const margin = 24 * scale;

  ctx.save();

  // Prepare stamp text lines
  const lines: { text: string; isHeader?: boolean; isHighlight?: boolean; isSmall?: boolean }[] = [];

  // 1. Project & Work item
  if (template.fields.showProject && meta.projectName) {
    const pCode = meta.projectCode ? ` [${meta.projectCode}]` : '';
    lines.push({
      text: `DỰ ÁN: ${meta.projectName.toUpperCase()}${pCode}`,
      isHeader: true,
    });
  }

  if (template.fields.showWorkItem && meta.workItemName) {
    lines.push({
      text: `HẠNG MỤC: ${meta.workItemName}`,
      isHighlight: true,
    });
  }

  // 2. Date & Time with Data Source label
  if (template.fields.showDateTime && meta.displayDateTime) {
    const dtFormatted = formatDateTime(
      meta.displayDateTime,
      template.dateFormat,
      template.timeFormat,
      template.showSeconds
    );
    const sourceLabel =
      meta.dateTimeSource === 'device'
        ? '[Thiết bị]'
        : meta.dateTimeSource === 'adjusted'
        ? '[Điều chỉnh]'
        : '[Tùy chỉnh]';
    lines.push({
      text: `THỜI GIAN: ${dtFormatted}  ${sourceLabel}`,
    });
  }

  // 3. GPS Coordinates & Altitude
  if (template.fields.showGps && meta.gps) {
    const dec = template.gpsDecimals || 5;
    const latStr = meta.gps.latitude.toFixed(dec);
    const lngStr = meta.gps.longitude.toFixed(dec);
    let gpsText = `TỌA ĐỘ: ${latStr}°N, ${lngStr}°E`;
    if (meta.gps.altitude !== undefined) {
      gpsText += ` (Cao độ: ${meta.gps.altitude.toFixed(1)}m)`;
    }
    const gpsSourceLabel = meta.gpsSource === 'device' ? '[GPS Thật]' : '[Nhập tay]';
    lines.push({
      text: `${gpsText}  ${gpsSourceLabel}`,
    });
  } else if (template.fields.showGps && !meta.gps) {
    lines.push({
      text: `TỌA ĐỘ: Chưa xác định`,
      isSmall: true,
    });
  }

  // 4. Address
  if (template.fields.showAddress && meta.address) {
    const addrLabel = meta.addressSource === 'manual' ? '[Nhập tay]' : '';
    lines.push({
      text: `ĐỊA CHỈ: ${meta.address} ${addrLabel}`.trim(),
    });
  }

  // 5. Author & Contractor
  if (template.fields.showAuthor && meta.author) {
    let authorLine = `NGƯỜI CHỤP: ${meta.author}`;
    if (template.fields.showContractor && meta.contractor) {
      authorLine += `  |  ĐƠN VỊ: ${meta.contractor}`;
    }
    lines.push({ text: authorLine });
  } else if (template.fields.showContractor && meta.contractor) {
    lines.push({ text: `ĐƠN VỊ: ${meta.contractor}` });
  }

  // 6. Notes
  if (template.fields.showNotes && meta.notes) {
    lines.push({
      text: `GHI CHÚ: ${meta.notes}`,
      isHighlight: true,
    });
  }

  // 7. Photo ID & SHA-256 Hash
  if (template.fields.showPhotoId && meta.photoId) {
    let idLine = `MÃ ẢNH: #${meta.photoId.slice(0, 12)}`;
    if (template.fields.showIntegrityHash && meta.sha256Hash) {
      idLine += `  |  HASH: ${meta.sha256Hash.slice(0, 16)}...`;
    }
    lines.push({
      text: idLine,
      isSmall: true,
    });
  }

  if (lines.length === 0) {
    ctx.restore();
    return;
  }

  // Calculate box width and word-wrapping
  const isBanner = template.position === 'bottom-bar' || template.position === 'top-bar';
  const maxBoxWidth = isBanner ? width : Math.min(width * 0.85, 960 * scale);

  // Set font for measurement
  ctx.font = `${baseFontSize}px ${template.fontFamily || 'system-ui'}`;

  // Word wrap lines so text never overflows image bounds
  const wrappedLines: { text: string; isHeader?: boolean; isHighlight?: boolean; isSmall?: boolean }[] = [];
  const maxTextWidth = isBanner ? width - padding * 2 : maxBoxWidth - padding * 2;

  for (const item of lines) {
    const words = item.text.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        wrappedLines.push({ ...item, text: currentLine });
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      wrappedLines.push({ ...item, text: currentLine });
    }
  }

  // Compute total height
  const contentHeight = wrappedLines.length * lineHeight;
  const boxHeight = contentHeight + padding * 2;
  let boxWidth = isBanner ? width : 0;

  if (!isBanner) {
    let maxW = 0;
    for (const line of wrappedLines) {
      const w = ctx.measureText(line.text).width;
      if (w > maxW) maxW = w;
    }
    boxWidth = Math.min(maxBoxWidth, maxW + padding * 2 + 10);
  }

  // Calculate position coordinates
  let boxX = margin;
  let boxY = height - boxHeight - margin;

  if (template.position === 'bottom-right') {
    boxX = width - boxWidth - margin;
    boxY = height - boxHeight - margin;
  } else if (template.position === 'top-left') {
    boxX = margin;
    boxY = margin;
  } else if (template.position === 'top-right') {
    boxX = width - boxWidth - margin;
    boxY = margin;
  } else if (template.position === 'bottom-bar') {
    boxX = 0;
    boxY = height - boxHeight;
  } else if (template.position === 'top-bar') {
    boxX = 0;
    boxY = 0;
  }

  // Draw background
  const hex = template.bgColor || '#0f172a';
  const alpha = template.bgOpacity !== undefined ? template.bgOpacity : 0.85;
  
  // Convert hex to rgba
  let r = 15, g = 23, b = 42;
  if (hex.startsWith('#') && hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

  if (isBanner) {
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  } else {
    // Rounded rectangle card
    const radius = 10 * scale;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();

    // Subtle outline for outdoor high contrast
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.25)`;
    ctx.stroke();
  }

  // Draw Accent Indicator bar on the left of the card
  const accentBarWidth = 4 * scale;
  ctx.fillStyle = '#0284c7'; // Sky Blue Accent
  if (!isBanner) {
    ctx.fillRect(boxX + 2, boxY + 6 * scale, accentBarWidth, boxHeight - 12 * scale);
  }

  // Render text lines
  let textY = boxY + padding + baseFontSize * 0.85;
  const textX = boxX + padding + (isBanner ? 0 : accentBarWidth + 4 * scale);

  for (const line of wrappedLines) {
    if (line.isHeader) {
      ctx.font = `bold ${baseFontSize * 1.05}px ${template.fontFamily || 'system-ui'}`;
      ctx.fillStyle = template.textColor || '#ffffff';
    } else if (line.isHighlight) {
      ctx.font = `600 ${baseFontSize}px ${template.fontFamily || 'system-ui'}`;
      ctx.fillStyle = '#fbbf24'; // Warm amber highlight
    } else if (line.isSmall) {
      ctx.font = `400 ${baseFontSize * 0.85}px monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    } else {
      ctx.font = `500 ${baseFontSize}px ${template.fontFamily || 'system-ui'}`;
      ctx.fillStyle = template.textColor || '#ffffff';
    }

    // Shadow for text legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3 * scale;
    ctx.shadowOffsetX = 1 * scale;
    ctx.shadowOffsetY = 1 * scale;

    ctx.fillText(line.text, textX, textY);
    textY += lineHeight;
  }

  ctx.restore();
}

/**
 * Main Stamp Engine entrypoint: processes a raw image (Blob or HTMLImageElement),
 * applies watermark stamps directly to pixels, produces stamped blob, thumbnail blob and SHA-256 hash.
 */
export async function processAndStampPhoto(
  source: Blob | HTMLImageElement,
  metadata: StampRenderMetadata,
  template: StampTemplate,
  options: {
    quality?: number;
    maxDimension?: number;
  } = {}
): Promise<StampEngineOutput> {
  const img = source instanceof HTMLImageElement ? source : await loadImageElement(source);

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  // Optional dimension clamp for memory safety
  const maxDim = options.maxDimension || 3840;
  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // 1. Create main full-resolution canvas
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = targetWidth;
  mainCanvas.height = targetHeight;
  const ctx = mainCanvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Cannot acquire 2D canvas context');

  // Draw source image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Apply pixel stamp
  await renderStampOnCanvas(ctx, targetWidth, targetHeight, metadata, template);

  // Convert main canvas to Blob
  const quality = options.quality !== undefined ? options.quality : 0.92;
  const stampedBlob = await new Promise<Blob>((resolve, reject) => {
    mainCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create stamped Blob'))),
      'image/jpeg',
      quality
    );
  });

  // 2. Create small thumbnail for instant gallery loading (~400px width)
  const thumbCanvas = document.createElement('canvas');
  const thumbWidth = 400;
  const thumbHeight = Math.round((targetHeight / targetWidth) * thumbWidth);
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(mainCanvas, 0, 0, thumbWidth, thumbHeight);
  }
  const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
    thumbCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create thumbnail Blob'))),
      'image/jpeg',
      0.75
    );
  });

  // Calculate SHA-256 integrity hash of stamped photo
  const sha256Hash = await calculateSha256(stampedBlob);

  const dataUrl = mainCanvas.toDataURL('image/jpeg', 0.85);

  return {
    stampedBlob,
    thumbnailBlob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    sizeBytes: stampedBlob.size,
    sha256Hash,
  };
}
