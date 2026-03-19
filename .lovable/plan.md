

## Plan: Replace `useAudioRecorder` hook with inline recording logic in Surveys page

### Problem
The `useAudioRecorder` hook has a complex Promise-based `stopRecording` that silently swallows upload errors and returns `null`. The user has confirmed that a simpler inline approach (provided in their message) successfully uploads to the `sale-recordings` bucket.

### Changes

**File: `src/pages/Surveys.tsx`**

1. Remove the `useAudioRecorder` import and its destructured usage (lines 16, 221-229)
2. Add inline state variables: `isRecording`, `mediaRecorder`, `recordedAudio`, `recordingDuration`, and a duration timer ref
3. Implement `startRecording` using the user's proven pattern — `navigator.mediaDevices.getUserMedia`, `MediaRecorder`, and direct `supabase.storage.upload` inside `recorder.onstop`
4. Implement `stopRecording` to stop the recorder and tracks
5. Update `handleSubmitSurvey` (line 254-263): since the upload now happens inside `recorder.onstop` asynchronously, we need to await the upload completing before submitting. We'll wrap the stop+upload in a Promise that resolves with the uploaded URL, similar to the user's pattern but returning the public URL for metadata storage
6. Update `submitSurveyResponse` to use the resolved recording URL in the interaction metadata
7. Update the recording indicator to use the new `recordingDuration` state
8. Update the discard/back button to stop recording and clean up tracks
9. Keep the `RecordingIndicator` component usage with the new duration state

### Key difference from current implementation
The current hook uses `getPublicUrl()` which may return a URL even if the upload failed. The new approach uses direct error checking in `recorder.onstop` and provides explicit success/failure toast feedback, matching the user's working code.

