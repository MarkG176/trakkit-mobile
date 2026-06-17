## Plan

Resize camera-captured images before overlay drawing to keep uploads under ~400 KB.

### Changes

1. **src/utils/imageOverlay.ts**
   - Before drawing, compute a scale factor so the longest canvas side is capped at 1280 px.
   - Adjust `fontSize` proportionally to the scaled width.
   - Change `canvas.toBlob(..., 'image/jpeg', 0.9)` → `0.78`.

No other files need modification.