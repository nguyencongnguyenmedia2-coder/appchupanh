import { describe, it, expect } from 'vitest';
import { validateCoordinates } from '../src/services/geolocation/geoService';

describe('Geolocation Validation', () => {
  it('validates correct latitude and longitude coordinates', () => {
    expect(validateCoordinates(10.762622, 106.660172)).toBe(true);
    expect(validateCoordinates(0, 0)).toBe(true);
    expect(validateCoordinates(-90, -180)).toBe(true);
    expect(validateCoordinates(90, 180)).toBe(true);
  });

  it('rejects invalid latitude and longitude out of bounds', () => {
    expect(validateCoordinates(91, 100)).toBe(false);
    expect(validateCoordinates(-91, 100)).toBe(false);
    expect(validateCoordinates(10, 181)).toBe(false);
    expect(validateCoordinates(10, -181)).toBe(false);
    expect(validateCoordinates(NaN as any, 100)).toBe(false);
    expect(validateCoordinates(10, undefined as any)).toBe(false);
  });
});
