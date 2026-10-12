import React, { useState, useEffect, useRef } from 'react';
import {
  cameraService,
  CameraDeviceInfo,
} from '../../services/camera/cameraService';
import { getCurrentCoordinates, reverseGeocode } from '../../services/geolocation/geoService';
import { processAndStampPhoto, StampRenderMetadata } from '../../services/image/stampEngine';
import { savePhotoBlob } from '../../storage/blobStorage';
import { db } from '../../storage/db';
import { Project, WorkItem, StampTemplate, PhotoRecord } from '../../models';
import { QuickProjectPicker } from './QuickProjectPicker';
import { ConfirmCaptureModal } from './ConfirmCaptureModal';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Clock,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

interface CameraViewProps {
  onPhotoSaved?: (photo: PhotoRecord) => void;
  preSelectedProjectId?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onPhotoSaved,
  preSelectedProjectId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    preSelectedProjectId || ''
  );
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<StampTemplate | null>(null);

  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [resolution, setResolution] = useState<'4k' | '1080p' | '720p'>('1080p');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Capture result state for confirmation modal
  const [capturedState, setCapturedState] = useState<{
    originalBlob: Blob;
    previewDataUrl: string;
    displayDateTime: string;
    gps: { latitude: number; longitude: number; altitude?: number } | null;
    gpsSource: 'device' | 'manual' | 'none';
    address: string;
    addressSource: 'geocoded' | 'manual' | 'none';
    author: string;
    contractor: string;
    template: StampTemplate;
  } | null>(null);

  // Load initial projects, work items & template
  useEffect(() => {
    const loadInitData = async () => {
      const pList = await db.projects.toArray();
      setProjects(pList);
      if (preSelectedProjectId) {
        setSelectedProjectId(preSelectedProjectId);
      } else if (pList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(pList[0].id);
      }

      const items = await db.workItems.toArray();
      setWorkItems(items);
      if (items.length > 0 && !selectedWorkItemId) {
        setSelectedWorkItemId(items[0].id);
      }

      // Load default template
      const defaultT =
        (await db.stampTemplates.where('isDefault').equals(1 as any).first()) ||
        (await db.stampTemplates.toCollection().first());
      if (defaultT) setCurrentTemplate(defaultT);
    };

    loadInitData();
  }, [preSelectedProjectId]);

  // Start Camera Stream
  useEffect(() => {
    let mounted = true;

    const startStream = async () => {
      if (!videoRef.current) return;
      try {
        setCameraError(null);
        await cameraService.startCamera(videoRef.current, {
          deviceId: activeDeviceId || undefined,
          facingMode,
          resolution,
        });

        if (mounted) {
          setHasTorch(cameraService.isTorchSupported());
          const available = await cameraService.getAvailableCameras();
          setCameras(available);
        }
      } catch (err: any) {
        if (mounted) {
          setCameraError(err.message || 'Không thể khởi động camera');
        }
      }
    };

    startStream();

    return () => {
      mounted = false;
      cameraService.stopCamera();
    };
  }, [activeDeviceId, facingMode, resolution]);

  // Switch camera front / back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setActiveDeviceId('');
  };

  // Toggle flash torch
  const handleToggleTorch = async () => {
    const on = await cameraService.toggleTorch();
    setIsTorchOn(on);
  };

  // Trigger Capture (with timer if set)
  const handleTriggerCapture = () => {
    if (isCapturing || countdown !== null) return;

    if (timerSeconds > 0) {
      let count = timerSeconds;
      setCountdown(count);
      cameraService.playBeep(false);

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          cameraService.playBeep(false);
        } else {
          clearInterval(interval);
          setCountdown(null);
          cameraService.playBeep(true);
          performCapture();
        }
      }, 1000);
    } else {
      performCapture();
    }
  };

  // Perform direct frame capture from video element
  const performCapture = async () => {
    if (!videoRef.current || !currentTemplate) return;
    setIsCapturing(true);

    try {
      const rawBlob = await cameraService.captureFrame(videoRef.current);
      await processRawPhotoForConfirmation(rawBlob);
    } catch (err: any) {
      alert('Lỗi chụp ảnh: ' + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  // Handle Photo Import from device gallery
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTemplate) return;

    setIsCapturing(true);
    try {
      await processRawPhotoForConfirmation(file);
    } catch (err: any) {
      alert('Lỗi đọc ảnh từ thiết bị: ' + err.message);
    } finally {
      setIsCapturing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Process raw photo (capture or import) with location and generate initial stamp preview
  const processRawPhotoForConfirmation = async (blob: Blob) => {
    if (!currentTemplate) return;

    const now = new Date();
    const isoDateTime = now.toISOString();

    // 1. Get GPS coordinates
    const geo = await getCurrentCoordinates();
    const gpsData = geo.isAvailable
      ? {
          latitude: geo.latitude,
          longitude: geo.longitude,
          altitude: geo.altitude,
          accuracy: geo.accuracy,
        }
      : null;

    // 2. Reverse geocode if online and coordinates available
    let addressStr = '';
    let addressSource: 'geocoded' | 'manual' | 'none' = 'none';

    if (gpsData) {
      const geoResult = await reverseGeocode(gpsData.latitude, gpsData.longitude);
      if (geoResult && geoResult.address) {
        addressStr = geoResult.address;
        addressSource = 'geocoded';
      }
    }

    // Fallback to project address if reverse geocoding is unavailable
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (!addressStr && proj?.address) {
      addressStr = proj.address;
      addressSource = 'manual';
    }

    const workItem = workItems.find((w) => w.id === selectedWorkItemId);

    // Initial render for confirmation modal
    const meta: StampRenderMetadata = {
      displayDateTime: isoDateTime,
      dateTimeSource: 'device',
      gps: gpsData,
      gpsSource: gpsData ? 'device' : 'none',
      address: addressStr,
      addressSource,
      projectName: proj?.name,
      projectCode: proj?.code,
      workItemName: workItem?.name,
      author: 'Kỹ sư Giám sát',
      contractor: proj?.contractor || '',
      notes: '',
      photoId: `PHOTO-${Date.now().toString(36).toUpperCase()}`,
    };

    const stampedResult = await processAndStampPhoto(blob, meta, currentTemplate);

    setCapturedState({
      originalBlob: blob,
      previewDataUrl: stampedResult.dataUrl,
      displayDateTime: isoDateTime,
      gps: gpsData,
      gpsSource: gpsData ? 'device' : 'none',
      address: addressStr,
      addressSource,
      author: 'Kỹ sư Giám sát',
      contractor: proj?.contractor || '',
      template: currentTemplate,
    });
  };

  // Final confirmation save to IndexedDB
  const handleConfirmSave = async (finalData: {
    displayDateTime: string;
    dateTimeSource: 'device' | 'manual' | 'adjusted';
    gpsDisplay: { latitude: number; longitude: number; altitude?: number } | null;
    gpsSource: 'device' | 'manual' | 'none';
    addressDisplay: string;
    addressSource: 'geocoded' | 'manual' | 'none';
    author: string;
    contractor: string;
    notes: string;
    saveOriginal: boolean;
  }) => {
    if (!capturedState || !currentTemplate) return;

    const photoId = `img-${Date.now()}`;
    const proj = projects.find((p) => p.id === selectedProjectId);
    const workItem = workItems.find((w) => w.id === selectedWorkItemId);

    // Re-render final stamp with any edited parameters
    const finalMeta: StampRenderMetadata = {
      displayDateTime: finalData.displayDateTime,
      dateTimeSource: finalData.dateTimeSource,
      gps: finalData.gpsDisplay,
      gpsSource: finalData.gpsSource,
      address: finalData.addressDisplay,
      addressSource: finalData.addressSource,
      projectName: proj?.name,
      projectCode: proj?.code,
      workItemName: workItem?.name,
      author: finalData.author,
      contractor: finalData.contractor,
      notes: finalData.notes,
      photoId,
    };

    const finalOutput = await processAndStampPhoto(
      capturedState.originalBlob,
      finalMeta,
      currentTemplate
    );

    // Save stamped blob
    const stampedBlobId = `stamped-${photoId}`;
    await savePhotoBlob(
      stampedBlobId,
      photoId,
      'stamped',
      finalOutput.stampedBlob,
      'image/jpeg'
    );

    // Save thumbnail blob
    const thumbBlobId = `thumb-${photoId}`;
    await savePhotoBlob(
      thumbBlobId,
      photoId,
      'thumbnail',
      finalOutput.thumbnailBlob,
      'image/jpeg'
    );

    // Save original blob if user enabled
    let originalBlobId: string | undefined;
    if (finalData.saveOriginal) {
      originalBlobId = `orig-${photoId}`;
      await savePhotoBlob(
        originalBlobId,
        photoId,
        'original',
        capturedState.originalBlob,
        'image/jpeg'
      );
    }

    const nowIso = new Date().toISOString();
    const photoRecord: PhotoRecord = {
      id: photoId,
      projectId: selectedProjectId || undefined,
      workItemId: selectedWorkItemId || undefined,
      title: `${workItem?.name || 'Ảnh công trình'} - ${new Date(finalData.displayDateTime).toLocaleTimeString('vi-VN')}`,
      notes: finalData.notes,
      capturedAtOriginal: capturedState.displayDateTime,
      displayDateTime: finalData.displayDateTime,
      dateTimeSource: finalData.dateTimeSource,
      gpsOriginal: capturedState.gps,
      gpsDisplay: finalData.gpsDisplay,
      gpsSource: finalData.gpsSource,
      addressOriginal: capturedState.address,
      addressDisplay: finalData.addressDisplay,
      addressSource: finalData.addressSource,
      author: finalData.author,
      contractor: finalData.contractor,
      originalPhotoBlobId: originalBlobId,
      stampedPhotoBlobId: stampedBlobId,
      thumbnailBlobId: thumbBlobId,
      mimeType: 'image/jpeg',
      width: finalOutput.width,
      height: finalOutput.height,
      sizeBytes: finalOutput.sizeBytes,
      templateSnapshot: currentTemplate,
      sha256Hash: finalOutput.sha256Hash,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.photos.put(photoRecord);

    setCapturedState(null);
    if (onPhotoSaved) {
      onPhotoSaved(photoRecord);
    }
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId);
  const selectedItem = workItems.find((w) => w.id === selectedWorkItemId);

  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      {/* Hidden file input for importing images */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Top Floating Bar: Quick Project & WorkItem Select */}
      <div className="absolute top-3 left-3 right-3 z-20">
        <QuickProjectPicker
          projects={projects}
          workItems={workItems}
          selectedProjectId={selectedProjectId}
          selectedWorkItemId={selectedWorkItemId}
          onSelectProject={setSelectedProjectId}
          onSelectWorkItem={setSelectedWorkItemId}
        />
      </div>

      {/* Video Viewfinder */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950">
        {cameraError ? (
          <div className="mx-6 max-w-md rounded-2xl border border-red-500/20 bg-red-950/40 p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-3 text-lg font-bold text-white">
              Không thể truy cập Camera
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-red-200">
              {cameraError}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => handleFlipCamera()}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold hover:bg-slate-700"
              >
                Thử đổi camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold hover:bg-sky-500"
              >
                Nhập ảnh có sẵn từ thiết bị
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}

        {/* Live Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-500/80 text-6xl font-black text-white shadow-2xl animate-ping">
              {countdown}
            </div>
          </div>
        )}

        {/* Live Stamp Watermark Indicator Overlay in Viewfinder */}
        {currentTemplate && !cameraError && (
          <div className="pointer-events-none absolute bottom-24 left-4 z-10 max-w-xs rounded-xl bg-slate-950/75 p-3 text-[11px] text-white backdrop-blur-md border border-white/10 shadow-lg">
            <div className="font-bold text-sky-400">
              {selectedProj ? selectedProj.name.toUpperCase() : 'TIMESNAP PRO'}
            </div>
            {selectedItem && (
              <div className="text-amber-300 font-semibold">
                Hạng mục: {selectedItem.name}
              </div>
            )}
            <div className="text-slate-300">
              Mẫu: {currentTemplate.name}
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls Footer */}
      <div className="z-20 flex flex-col bg-slate-950/95 px-6 pt-3 pb-6 border-t border-slate-900">
        {/* Upper options bar: Timer, Torch, Resolution, Switch Camera */}
        <div className="flex items-center justify-between pb-4 text-xs">
          {/* Timer button */}
          <button
            onClick={() => {
              const sequence = [0, 3, 5, 10];
              const next = sequence[(sequence.indexOf(timerSeconds) + 1) % sequence.length];
              setTimerSeconds(next);
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
              timerSeconds > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{timerSeconds > 0 ? `${timerSeconds}s` : 'Hẹn giờ'}</span>
          </button>

          {/* Flash / Torch toggle */}
          {hasTorch && (
            <button
              onClick={handleToggleTorch}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                isTorchOn
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isTorchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              <span>Flash</span>
            </button>
          )}

          {/* Resolution toggle */}
          <button
            onClick={() => {
              const resMap: Record<string, '4k' | '1080p' | '720p'> = {
                '720p': '1080p',
                '1080p': '4k',
                '4k': '720p',
              };
              setResolution(resMap[resolution]);
            }}
            className="rounded-full bg-slate-800 px-3 py-1 text-slate-300 font-mono text-[11px] hover:text-white"
          >
            {resolution.toUpperCase()}
          </button>

          {/* Flip camera */}
          <button
            onClick={handleFlipCamera}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-slate-400 hover:text-white"
            title="Đổi camera trước/sau"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Đổi camera</span>
          </button>
        </div>

        {/* Lower trigger bar: Gallery Import, Shutter Button, Quick Template Picker */}
        <div className="flex items-center justify-around">
          {/* Gallery Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
            title="Nhập ảnh từ thư viện"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-[10px]">Tải ảnh lên</span>
          </button>

          {/* Big Shutter Button */}
          <button
            onClick={handleTriggerCapture}
            disabled={isCapturing}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-sky-400/80 bg-white/10 p-1.5 transition-all active:scale-90"
            title="Chụp ảnh công trình"
          >
            <div
              className={`h-full w-full rounded-full transition-transform group-hover:scale-95 ${
                isCapturing
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-white shadow-xl shadow-white/30'
              }`}
            />
          </button>

          {/* Empty spacer or switch camera button */}
          <button
            onClick={handleFlipCamera}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800">
              <RefreshCw className="h-5 w-5" />
            </div>
            <span className="text-[10px]">Xoay cam</span>
          </button>
        </div>
      </div>

      {/* Confirmation & Stamp Tweak Modal */}
      {capturedState && (
        <ConfirmCaptureModal
          isOpen={true}
          previewDataUrl={capturedState.previewDataUrl}
          originalBlob={capturedState.originalBlob}
          initialDateTime={capturedState.displayDateTime}
          initialGps={capturedState.gps}
          initialAddress={capturedState.address}
          gpsSource={capturedState.gpsSource}
          addressSource={capturedState.addressSource}
          project={selectedProj}
          workItem={selectedItem}
          defaultAuthor={capturedState.author}
          defaultContractor={capturedState.contractor}
          template={capturedState.template}
          onRetake={() => setCapturedState(null)}
          onConfirmSave={handleConfirmSave}
        />
      )}
    </div>
  );
};
