

## Add Image Captions to All Photo Uploads

### Overview
Allow BAs (agents) to add a free-text caption to every image they upload across the app. Captions will be stored in the existing `image_metadata` JSONB column (on `interactions`) or in the `metadata` JSONB of the relevant record, requiring no schema changes.

### Image Upload Flows to Modify

There are **5 distinct image upload points**:

1. **CameraCapture** (`src/components/CameraCapture.tsx`) — check-in/out selfies, general photos
2. **StoreSuccessDialog** (`src/components/StoreSuccessDialog.tsx`) — feedback photos at stores (multi-image)
3. **RecordSale** (`src/pages/RecordSale.tsx`) — wholesale sale photo
4. **ActivityDetail** (`src/pages/ActivityDetail.tsx`) — attached pictures to activities
5. **CheckInOutDialog** (`src/components/dashboard/CheckInOutDialog.tsx`) — selfie upload for status changes

### Implementation

#### 1. Create a reusable `ImageCaptionInput` component
A small component: text input that appears below a photo preview, with placeholder "Add a caption..." and a max length of 200 characters.

#### 2. CameraCapture — Add caption prompt
- After file selection and before upload, show a small dialog/modal with the image preview and a caption text input.
- Pass the caption through to `uploadToStorage`, which will embed it in the image overlay text (add to `ImageOverlayData`) and also return it to the `onCapture` callback.
- Update `ImageOverlayData` interface to include optional `caption` field.
- Update `addTextOverlayToImage` to render caption text on the image if provided.

#### 3. StoreSuccessDialog — Per-photo captions
- Change `selectedPhotos` state from `File[]` to `{ file: File, caption: string }[]`.
- Show a caption input below each photo preview thumbnail.
- When uploading to `store_images`, store captions in the interaction's `image_metadata` as `{ captions: [{ fileName, caption }] }`.

#### 4. RecordSale — Caption for sale photo
- Add a caption text input below the sale photo preview.
- Pass caption into `useSalesForm.submitSale()` via `image_metadata.caption`.

#### 5. ActivityDetail — Caption per attached picture
- After photo selection, prompt for a caption before uploading.
- Store in the interaction's `metadata.image_captions` array.

#### 6. CheckInOutDialog — Caption for selfie
- Add a caption input below the selfie preview.
- Include caption in the `agent_status_log` record's existing columns or in a metadata field passed during status update.

### Storage Approach
- **No database migration needed** — captions are stored in existing JSONB columns (`image_metadata`, `metadata`) on `interactions`, `agent_status_log`, and `giveaways` tables.
- For `CameraCapture` overlay images, the caption is also burned into the image overlay text itself.

### Technical Details
- New component: `src/components/ImageCaptionInput.tsx`
- Modified files: `CameraCapture.tsx`, `StoreSuccessDialog.tsx`, `RecordSale.tsx`, `ActivityDetail.tsx`, `CheckInOutDialog.tsx`, `imageOverlay.ts`
- `ImageOverlayData` gets optional `caption?: string`
- `CameraCapture` props get `showCaptionPrompt?: boolean` (default true)

