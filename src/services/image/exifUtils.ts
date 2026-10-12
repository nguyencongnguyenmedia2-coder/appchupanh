/**
 * Normalizes an image file/blob to an ImageBitmap or HTMLImageElement
 * ensuring proper orientation regardless of mobile EXIF tags.
 */
export async function loadImageElement(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    img.onload = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      resolve(img);
    };

    img.onerror = (err) => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(err);
    };

    img.src = url;
  });
}
