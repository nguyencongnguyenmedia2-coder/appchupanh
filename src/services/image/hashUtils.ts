/**
 * Tính mã băm SHA-256 cho tệp ảnh để kiểm tra tính toàn vẹn.
 * Lưu ý quan trọng: Mã băm SHA-256 chứng minh tệp không bị thay đổi sau khi được tạo,
 * nhưng không tự chứng minh thời gian hoặc vị trí chụp là thật nếu thiếu nguồn tham chiếu độc lập.
 */
export async function calculateSha256(blobOrBuffer: Blob | ArrayBuffer): Promise<string> {
  const buffer =
    blobOrBuffer instanceof Blob
      ? await blobOrBuffer.arrayBuffer()
      : blobOrBuffer;

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
