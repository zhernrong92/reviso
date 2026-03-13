import type { TextRegion } from '../types/document';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Find the dominant (most frequent) color from pixel data.
 *
 * Key insight: in a text region, text strokes are thin and the background
 * fills the rest. The background always has more pixels than the text,
 * so the most frequent color bucket IS the background.
 */
function dominantColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): [number, number, number] {
  if (width === 0 || height === 0) return [255, 255, 255];

  // Stride: sample every Nth pixel for speed. For a typical region,
  // this gives hundreds to thousands of samples — more than enough.
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 40));

  // Quantize step — group similar colors together.
  // Step of 4 keeps accuracy high while merging JPEG noise.
  const STEP = 4;

  const buckets = new Map<string, { count: number; rSum: number; gSum: number; bSum: number }>();

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx]!;
      const g = pixels[idx + 1]!;
      const b = pixels[idx + 2]!;

      const qr = Math.round(r / STEP) * STEP;
      const qg = Math.round(g / STEP) * STEP;
      const qb = Math.round(b / STEP) * STEP;
      const key = `${qr},${qg},${qb}`;

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count++;
        bucket.rSum += r;
        bucket.gSum += g;
        bucket.bSum += b;
      } else {
        buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
      }
    }
  }

  // Find the largest bucket — this is the background
  let best = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
  for (const bucket of buckets.values()) {
    if (bucket.count > best.count) {
      best = bucket;
    }
  }

  if (best.count === 0) return [255, 255, 255];

  // Average the actual pixel values in the winning bucket for precision
  return [
    Math.round(best.rSum / best.count),
    Math.round(best.gSum / best.count),
    Math.round(best.bSum / best.count),
  ];
}

function loadImageToCanvas(src: string): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const onLoad = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx });
    };

    img.onload = onLoad;
    img.onerror = () => reject(new Error('Failed to load image for background detection'));

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      img.src = src;
    } else {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
          return res.blob();
        })
        .then((blob) => { img.src = URL.createObjectURL(blob); })
        .catch(reject);
    }
  });
}

/**
 * Detect the dominant background color for each region by finding the most
 * frequent color in the region's pixel data. Text strokes are always the
 * minority; the background always wins by pixel count.
 *
 * Returns a Map of regionId → hex color string.
 */
export async function detectRegionBackgrounds(
  imageSrc: string,
  regions: ReadonlyArray<Pick<TextRegion, 'id' | 'x1' | 'y1' | 'x2' | 'y2'>>,
): Promise<Map<string, string>> {
  const { ctx, canvas } = await loadImageToCanvas(imageSrc);
  const result = new Map<string, string>();
  const imgW = canvas.width;
  const imgH = canvas.height;

  for (const region of regions) {
    const w = region.x2 - region.x1;
    const h = region.y2 - region.y1;

    if (w < 2 || h < 2) {
      result.set(region.id, '#ffffff');
      continue;
    }

    const rx = Math.max(0, Math.min(imgW - 1, Math.round(region.x1)));
    const ry = Math.max(0, Math.min(imgH - 1, Math.round(region.y1)));
    const rw = Math.min(Math.round(w), imgW - rx);
    const rh = Math.min(Math.round(h), imgH - ry);

    const imageData = ctx.getImageData(rx, ry, rw, rh);
    const [r, g, b] = dominantColor(imageData.data, rw, rh);
    result.set(region.id, rgbToHex(r, g, b));
  }

  return result;
}
