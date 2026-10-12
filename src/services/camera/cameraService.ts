export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface CameraStreamOptions {
  deviceId?: string;
  facingMode?: 'environment' | 'user';
  resolution?: '4k' | '1080p' | '720p';
}

export class CameraService {
  private activeStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private torchEnabled: boolean = false;

  async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'videoinput')
      .map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }));
  }

  async startCamera(
    videoElement: HTMLVideoElement,
    options: CameraStreamOptions = {}
  ): Promise<MediaStream> {
    this.stopCamera();

    const facingMode = options.facingMode || 'environment';
    let width = 1920;
    let height = 1080;

    if (options.resolution === '4k') {
      width = 3840;
      height = 2160;
    } else if (options.resolution === '720p') {
      width = 1280;
      height = 720;
    }

    const constraints: MediaStreamConstraints = {
      video: options.deviceId
        ? { deviceId: { exact: options.deviceId }, width: { ideal: width }, height: { ideal: height } }
        : { facingMode: { ideal: facingMode }, width: { ideal: width }, height: { ideal: height } },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.activeStream = stream;
      this.videoTrack = stream.getVideoTracks()[0] || null;

      videoElement.srcObject = stream;
      await videoElement.play();
      return stream;
    } catch (err: any) {
      // Fallback to simpler constraints if resolution failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
        this.activeStream = fallbackStream;
        this.videoTrack = fallbackStream.getVideoTracks()[0] || null;
        videoElement.srcObject = fallbackStream;
        await videoElement.play();
        return fallbackStream;
      } catch (fallbackErr) {
        throw new Error(
          err.name === 'NotAllowedError'
            ? 'Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền trong cài đặt trình duyệt/thiết bị.'
            : 'Không thể mở Camera: ' + (err.message || 'Thiết bị camera không khả dụng.')
        );
      }
    }
  }

  async toggleTorch(): Promise<boolean> {
    if (!this.videoTrack) return false;

    const capabilities = this.videoTrack.getCapabilities?.() as any;
    if (!capabilities || !capabilities.torch) {
      return false; // Torch not supported on this track
    }

    this.torchEnabled = !this.torchEnabled;
    try {
      await (this.videoTrack as any).applyConstraints({
        advanced: [{ torch: this.torchEnabled }],
      });
      return this.torchEnabled;
    } catch {
      this.torchEnabled = false;
      return false;
    }
  }

  isTorchSupported(): boolean {
    if (!this.videoTrack) return false;
    const capabilities = this.videoTrack.getCapabilities?.() as any;
    return !!(capabilities && capabilities.torch);
  }

  stopCamera(): void {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
      this.videoTrack = null;
      this.torchEnabled = false;
    }
  }

  captureFrame(videoElement: HTMLVideoElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const width = videoElement.videoWidth || 1920;
      const height = videoElement.videoHeight || 1080;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      ctx.drawImage(videoElement, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to Blob'));
        },
        'image/jpeg',
        0.95
      );
    });
  }

  // Play audio countdown beep using Web Audio API
  playBeep(isFinal: boolean = false): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isFinal ? 0.3 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isFinal ? 0.35 : 0.2));
    } catch {
      // AudioContext maybe blocked or unsupported
    }
  }
}

export const cameraService = new CameraService();
