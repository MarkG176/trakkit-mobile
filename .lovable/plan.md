
# Plan: Fix Low Memory Error During Sale Photo Capture

## Problem Summary
Budget devices (TECNO POP 9, INFINIX HOT 10T, ITEL A18) with 1-2GB RAM are crashing when processing high-resolution photos due to:
- Full-resolution canvas processing (12MP photo = ~48MB raw canvas)
- Multiple in-memory copies (FileReader base64 + Image object + Canvas)
- No explicit memory cleanup
- No image compression before upload

## Solution Overview
Implement three optimizations to reduce memory usage by ~90%:

1. **Image compression and resizing** - Resize images to max 1280px before any processing
2. **Error handling with retry** - Graceful fallback when memory fails
3. **Skip overlay for sale photos** - Upload compressed raw images for wholesale sales

---

## Technical Changes

### 1. Create New Image Compression Utility

**New File: `src/utils/imageCompressor.ts`**

Create a memory-efficient image compression utility that:
- Resizes images to a maximum dimension (1280px default)
- Compresses to JPEG at 80% quality
- Uses progressive loading to minimize peak memory usage
- Explicitly cleans up canvas and image objects after use
- Includes timeout protection for slow devices

Key functions:
- `compressImage(file: File, options?: CompressionOptions): Promise<File>` - Main compression function
- `revokeImageUrl(url: string)` - Helper to clean up object URLs

### 2. Update Image Overlay Utility

**File: `src/utils/imageOverlay.ts`**

Modify `addTextOverlayToImage` to:
- Accept already-compressed images (work with smaller canvas)
- Add explicit memory cleanup after processing
- Include try-catch for out-of-memory scenarios
- Reduce canvas memory footprint by not creating full-resolution copies

Changes:
- Add cleanup for canvas and image elements after processing
- Reduce default JPEG quality from 0.9 to 0.8
- Add memory-safe fallback that returns original file if overlay fails

### 3. Update RecordSale.tsx for Sale Photos

**File: `src/pages/RecordSale.tsx`**

Modify `uploadSalePhoto` and `handlePhotoCapture` to:
- Compress images before upload (skip overlay processing)
- Add error handling with user-friendly message
- Provide retry capability on failure
- Show compression progress indicator

Changes to `handlePhotoCapture`:
```typescript
const handlePhotoCapture = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Reset input immediately
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
  
  try {
    // Compress image before upload (no overlay for sale photos)
    const compressedFile = await compressImage(file, {
      maxDimension: 1280,
      quality: 0.8
    });
    
    const photoUrl = await uploadSalePhoto(compressedFile);
    if (photoUrl) {
      setSalePhotoUrl(photoUrl);
      toast({
        title: "Photo Captured",
        description: "Sale photo uploaded successfully.",
      });
    }
  } catch (error) {
    // Handle memory errors gracefully
    if (error.message?.includes('memory') || error.name === 'OutOfMemoryError') {
      toast({
        title: "Low Memory",
        description: "Could not process image. Please close other apps and try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Photo Failed",
        description: "Could not capture photo. Please try again.",
        variant: "destructive"
      });
    }
  }
};
```

### 4. Update CameraCapture.tsx for Check-in Photos

**File: `src/components/CameraCapture.tsx`**

Modify `uploadToStorage` and `handleFileChange` to:
- Compress images BEFORE adding overlay (reduces canvas size from ~48MB to ~5MB)
- Add memory error handling with fallback
- Clean up resources explicitly

Changes:
- Import `compressImage` from the new utility
- Compress file before passing to `addTextOverlayToImage`
- Add try-catch around overlay processing with fallback to upload without overlay
- Add explicit cleanup of object URLs

---

## Memory Optimization Details

### Before (Current Flow):
```
12MP Photo (3-10MB file)
  → FileReader base64 (~15MB string)
  → Image object (48MB raw pixels)
  → Canvas (48MB raw pixels)
  → toBlob output
Peak memory: ~120MB+
```

### After (Optimized Flow):
```
12MP Photo (3-10MB file)
  → Compressed to 1280px (~200KB file)
  → FileReader base64 (~300KB string)
  → Image object (5MB raw pixels)
  → Canvas (5MB raw pixels)
  → toBlob output
Peak memory: ~15MB
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/imageCompressor.ts` | Create | New compression utility |
| `src/utils/imageOverlay.ts` | Modify | Add memory cleanup, reduce quality |
| `src/pages/RecordSale.tsx` | Modify | Compress sale photos, skip overlay |
| `src/components/CameraCapture.tsx` | Modify | Compress before overlay, add fallback |

---

## Error Handling Strategy

1. **Memory error detection**: Check for "memory", "heap", or "allocation" in error messages
2. **Graceful degradation**: If overlay fails, upload compressed image without overlay
3. **User feedback**: Clear toast message explaining the issue and suggesting to close other apps
4. **Retry capability**: User can simply tap the camera button again to retry

---

## Testing Considerations

After implementation, test on:
- Budget devices with 1-2GB RAM
- High-resolution camera photos (8MP+)
- Multiple consecutive photo captures
- Low memory scenarios (many apps open)
