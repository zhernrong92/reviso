/**
 * Load an image source and return its bytes as PNG.
 * Uses canvas to convert any browser-supported format to PNG,
 * ensuring compatibility with pdf-lib (which only supports PNG and JPEG).
 */
export async function imageToPngBytes(
  src: string,
  width: number,
  height: number,
): Promise<ArrayBuffer> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create PNG blob'))),
      'image/png',
    );
  });

  return blob.arrayBuffer();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      img.src = src;
    } else {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          img.src = URL.createObjectURL(blob);
        })
        .catch(reject);
    }
  });
}
