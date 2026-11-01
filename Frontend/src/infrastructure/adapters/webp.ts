/**
 * Client-side image normalization on upload: re-encodes PNG/JPEG/GIF/BMP
 * uploads to WebP (smaller files, faster pages) entirely in the browser
 * before they reach the server. Falls back to the original file when the
 * browser can't encode WebP or the result would be larger.
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  if (!/^image\/(png|jpeg|gif|bmp|tiff|avif)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, '')}.webp`;
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function convertAllToWebP(files: File[]): Promise<File[]> {
  return Promise.all(files.map(convertToWebP));
}
