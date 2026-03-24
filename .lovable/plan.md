

## Analysis: Why Store Images Upload Fails

### Most Likely Root Cause

The upload code is structurally correct, but there are several failure paths that would silently prevent the image from reaching the bucket:

1. **Geolocation blocks the upload**: `getCurrentLocation()` runs BEFORE the storage upload. If location is denied or times out (10s timeout, `maximumAge: 0` forces fresh lookup), the entire function throws and the upload never executes. The error message shown would be a geolocation error, not a storage one.

2. **`capture` + `multiple` conflict on mobile**: The file input has both `capture="environment"` and `multiple`. On many mobile browsers, when `capture` is present, `multiple` is ignored and in some edge cases the file may not be properly captured into the `File` object array.

3. **Feedback-only submission**: If `feedbackNotes` has text but `selectedPhotos` is empty (e.g., the photo didn't register in state), the submit button is enabled and the function runs, shows "Feedback Submitted" toast, but skips the upload block entirely.

### Plan

**File: `src/components/StoreSuccessDialog.tsx`**

1. **Move photo upload BEFORE geolocation** -- Upload images first so they aren't blocked by location failures. Get location only for the interaction record (which can use a fallback).

2. **Remove `capture` attribute from the multi-photo input** -- Keep `accept="image/*"` which still prompts camera on mobile but doesn't conflict with `multiple`. This ensures all selected files register properly.

3. **Add geolocation fallback** -- If location fails, still proceed with the upload and interaction record using `latitude: 0, longitude: 0` instead of throwing.

4. **Add console logging** -- Log upload results for debugging, and log when `selectedPhotos` is empty at submit time.

### Technical Details

```text
Current flow:
  authenticate → get location → upload photos → insert interaction

Proposed flow:
  authenticate → upload photos → get location (with fallback) → insert interaction
```

The key change is decoupling the photo upload from the location requirement, and fixing the `capture`+`multiple` input conflict.

