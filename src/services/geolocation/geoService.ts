import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  isAvailable: boolean;
  errorMessage?: string;
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Get accurate current position using browser Geolocation API or Capacitor native plugin.
 */
export async function getCurrentCoordinates(): Promise<GeoLocationResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          return {
            latitude: 0,
            longitude: 0,
            isAvailable: false,
            errorMessage: 'Quyền vị trí bị từ chối trên thiết bị',
          };
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude ?? undefined,
        isAvailable: true,
      };
    } else {
      // Web / PWA navigator.geolocation
      if (!navigator.geolocation) {
        return {
          latitude: 0,
          longitude: 0,
          isAvailable: false,
          errorMessage: 'Trình duyệt không hỗ trợ Geolocation',
        };
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude ?? undefined,
              isAvailable: true,
            });
          },
          (err) => {
            let msg = 'Không thể lấy vị trí GPS';
            if (err.code === err.PERMISSION_DENIED) {
              msg = 'Quyền truy cập GPS bị từ chối. Bạn có thể nhập tọa độ thủ công.';
            } else if (err.code === err.TIMEOUT) {
              msg = 'Hết thời gian chờ tín hiệu GPS. Bạn có thể nhập tọa độ thủ công.';
            }
            resolve({
              latitude: 0,
              longitude: 0,
              isAvailable: false,
              errorMessage: msg,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 15000,
          }
        );
      });
    }
  } catch (err: any) {
    return {
      latitude: 0,
      longitude: 0,
      isAvailable: false,
      errorMessage: err?.message || 'Lỗi khi định vị GPS',
    };
  }
}

/**
 * Reverse geocodes coordinates to a Vietnamese address via OpenStreetMap Nominatim.
 * Handles offline gracefully: if offline or times out, returns null without throwing.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ address: string; raw?: any } | null> {
  if (!validateCoordinates(lat, lng)) return null;
  if (!navigator.onLine) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TimeSnapConstructionPro/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.display_name) {
      // Build clean short address
      const a = data.address || {};
      const parts = [
        a.road || a.pedestrian || a.suburb,
        a.quarter || a.ward || a.neighbourhood,
        a.city_district || a.district || a.county,
        a.city || a.state || a.province,
      ].filter(Boolean);

      const formatted = parts.length > 0 ? parts.join(', ') : data.display_name;
      return { address: formatted, raw: data };
    }
  } catch {
    // Offline or network error
  }
  return null;
}
