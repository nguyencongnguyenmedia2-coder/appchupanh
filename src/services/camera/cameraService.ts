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
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch {
      return [];
    }
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
      // 1. Try with preferred resolution & facingMode
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return await this.attachStreamToVideo(videoElement, stream);
    } catch (err: any) {
      // 2. Fallback to flexible facingMode without strict resolution
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
        return await this.attachStreamToVideo(videoElement, fallbackStream);
      } catch {
        // 3. Fallback to any available video camera
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          return await this.attachStreamToVideo(videoElement, simpleStream);
        } catch (finalErr: any) {
          throw new Error(
            err.name === 'NotAllowedError'
              ? 'Quyền truy cập Camera bị từ chối. Vui lòng bấm cho phép quyền camera trong trình duyệt hoặc dùng nút Tải ảnh lên.'
              : 'Không thể mở Camera: ' + (err.message || 'Thiết bị camera không khả dụng.')
          );
        }
      }
    }
  }

  private async attachStreamToVideo(
    videoElement: HTMLVideoElement,
    stream: MediaStream
  ): Promise<MediaStream> {
    this.activeStream = stream;
    this.videoTrack = stream.getVideoTracks()[0] || null;

    videoElement.srcObject = stream;
    try {
      await videoElement.play();
    } catch (e) {
      // Auto-play was prevented or already playing
    }
    return stream;
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
      if (!videoElement) {
        return reject(new Error('Khung hình camera không tồn tại'));
      }

      // Check video readyState
      if (videoElement.readyState < 2) {
        return reject(
          new Error('Camera chưa sẵn sàng hoặc luồng video chưa nạp xong. Vui lòng đợi 1 giây và thử lại.')
        );
      }

      const width = videoElement.videoWidth || 1920;
      const height = videoElement.videoHeight || 1080;

      if (width === 0 || height === 0) {
        return reject(new Error('Kích thước khung hình camera không hợp lệ. Vui lòng thử lại.'));
      }

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
          else reject(new Error('Lỗi xuất dữ liệu ảnh từ Canvas'));
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
