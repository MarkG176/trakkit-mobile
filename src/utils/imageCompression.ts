/**
 * Shared client-side image compression.
 *
 * Mobile cameras routinely produce 3-8MB+ JPEGs. Uploading those raw makes
 * every photo flow slow on field connections. This downsizes the longest side
 * and re-encodes as JPEG before upload. It decodes via `createImageBitmap`
 * (off the main thread, no base64 string inflation) with an `<img>` fallback.
 */

export interface CompressImageOptions {
  /** Longest-side cap in pixels. */
  maxDimension?: number;
  /** JPEG quality 0-1. */
  quality?: number;
  /** Output mime type. */
  mimeType?: string;
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxDimension: 1280,
  quality: 0.7,
  mimeType: "image/jpeg",
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), mimeType, quality));

const renameToJpg = (name: string): string =>
  name.replace(/\.[^./\\]+$/, "") + ".jpg";

interface DecodedImage {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
}

const decodeImage = async (file: File): Promise<DecodedImage> => {
  if (typeof createImageBitmap === "function") {
    // `imageOrientation: 'from-image'` respects EXIF rotation on supporting browsers.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
};

/**
 * Compress/resize an image file before upload. Fails open (returns the original
 * file) for non-images or if anything goes wrong, so callers can always upload.
 */
export const compressImage = async (
  file: File,
  options: CompressImageOptions = {},
): Promise<File> => {
  if (!file.type.startsWith("image/")) return file;

  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...options };

  let decoded: DecodedImage | null = null;
  try {
    decoded = await decodeImage(file);

    const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
    const targetWidth = Math.max(1, Math.round(decoded.width * scale));
    const targetHeight = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    decoded.draw(ctx, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (!blob) return file;
    // Don't replace the original with something larger (e.g. already-tiny image).
    if (blob.size >= file.size) return file;

    return new File([blob], renameToJpg(file.name), { type: mimeType });
  } catch (error) {
    console.error("Image compression failed, uploading original:", error);
    return file;
  } finally {
    decoded?.cleanup();
  }
};
