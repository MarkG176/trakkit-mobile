/**
 * Helpers for serving smaller image variants from Supabase Storage.
 *
 * Supabase can render resized/re-encoded images via the
 * `/storage/v1/render/image/public/` endpoint. For grid thumbnails we don't
 * need the full multi-MB original. `getThumbnailUrl` rewrites a public object
 * URL to a transformed one; callers should pair it with `thumbnailFallback`
 * as an `onError` handler so images still load if transforms aren't enabled
 * on the project.
 */

const PUBLIC_SEGMENT = "/storage/v1/object/public/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/";

export interface ThumbnailOptions {
  width?: number;
  quality?: number;
}

export const getThumbnailUrl = (
  url: string | null | undefined,
  { width = 300, quality = 60 }: ThumbnailOptions = {},
): string => {
  if (!url || !url.includes(PUBLIC_SEGMENT)) return url || "";
  const transformed = url.replace(PUBLIC_SEGMENT, RENDER_SEGMENT);
  const sep = transformed.includes("?") ? "&" : "?";
  return `${transformed}${sep}width=${width}&quality=${quality}&resize=cover`;
};

/**
 * onError handler that swaps a failed transformed URL back to the original.
 * Guards against infinite error loops via a data attribute.
 */
export const thumbnailFallback = (
  event: React.SyntheticEvent<HTMLImageElement>,
  originalUrl: string,
) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = originalUrl;
};
