# Shorts Editor Implementation Prompt

## Overview

Implement a complete video shorts editor that allows users to create portrait-oriented videos by selecting sections from a source video and creating multiple cropped clips that can be positioned and scaled within each section. This editor will replace the existing editor functionality.

## Core Concepts

- **Section**: A time range defined by start and end timestamps from the source video. All clips within a section share the same start and end times and play simultaneously.
- **Clip**: A cropped portion of a section's video, defined by crop coordinates and positioned/scaled within a portrait preview. Multiple clips from the same section play at the same time, showing different cropped areas of the same source footage.
- **Preview Window**: A portrait-oriented (9:16 aspect ratio) canvas showing how all clips will appear simultaneously in the final video

## Requirements

### 1. Frontend Data Architecture

#### Types Definition

Create comprehensive TypeScript types following the patterns in [docs/util.md](docs/util.md):

**Section Type:**
- id: string
- videoId: string (reference to source video)
- startTime: number (seconds)
- endTime: number (seconds)
- duration: number (calculated)
- order: number (for sequencing multiple sections)
- clips: Clip[]
- createdAt: Date
- updatedAt: Date

**Clip Type:**
- id: string
- sectionId: string
- cropX: number (source video x coordinate, pixels)
- cropY: number (source video y coordinate, pixels)
- cropWidth: number (source video crop width, pixels)
- cropHeight: number (source video crop height, pixels)
- previewX: number (position in portrait preview, 0-1 normalized)
- previewY: number (position in portrait preview, 0-1 normalized)
- previewScale: number (scale factor in preview, preserves aspect ratio)
- zIndex: number (layering order)
- thumbnailUrl: string (preview image)
- createdAt: Date
- updatedAt: Date

**Processing Job Type:**
- id: string
- videoId: string
- sections: Section[] (with clips)
- status: 'pending' | 'downloading' | 'processing' | 'complete' | 'failed'
- outputUrl: string | null
- error: string | null
- progress: number (0-100)
- createdAt: Date
- updatedAt: Date

### 2. Database Schema (Prisma)

Create Prisma models for Section, Clip, and ProcessingJob with proper relations to existing Video model. Follow RLS patterns from [lib/prisma-rls.ts](lib/prisma-rls.ts). Include userId for RLS and proper indexes for performance.

### 3. Frontend Components

All components should follow Next.js 15 App Router patterns and use TailwindCSS v4.

#### 3.1 Page Structure (`app/editor/[videoId]/page.tsx`)

Replace existing editor page with new shorts editor. Structure:
- Main video player (source video playback)
- Timeline scrubber with section markers
- Section list panel (left sidebar)
- Clip creation/editing panel (right sidebar)
- Portrait preview window (floating or docked)

#### 3.2 SectionManager Component

Responsible for creating and managing sections:
- Timeline interface showing source video duration with zoom controls (zoom in/out buttons or scroll wheel)
- Timeline zoom levels: 1x, 2x, 5x, 10x (allows precise timestamp selection)
- Click and drag to define section start/end times
- Display all sections as colored bars on timeline
- Click on timeline to seek video player to that timestamp
- Drag timeline playhead to scrub through video
- Section controls: edit times, delete, reorder
- Visual feedback for selected section
- Current time indicator synced with video player
- Keyboard shortcuts: Space (play/pause), Arrow keys (frame stepping), S (split at current time), +/- (zoom in/out)

#### 3.3 ClipCreator Component

Interface for creating clips from the selected section:
- Overlay crop frame on video player
- Draggable handles for resizing crop frame (both width and height independently)
- Display crop dimensions and coordinates
- "Create Clip" button generates thumbnail and adds clip to section
- Visual feedback showing all existing clips as outlined rectangles on video

#### 3.4 PreviewWindow Component

Portrait-oriented canvas (1080x1920 or 9:16 ratio) showing final output:
- Display all clips for selected section as positioned images
- Each clip image is draggable and scalable
- Clip selection highlights active clip with border
- Scale handles on corners (maintain aspect ratio)
- Z-index controls for layering
- Background color selector (default black)
- Play button to preview section with all clips animated

#### 3.5 ClipsList Component

List view of all clips in selected section:
- Thumbnail, dimensions, position info for each clip
- Edit button opens clip in preview window
- Delete button with confirmation
- Duplicate clip button
- Reorder via drag and drop

### 4. State Management (Zustand)

Create stores following patterns from [docs/util.md](docs/util.md):

#### 4.1 useShortsEditorStore

State:
- sourceVideo: Video | null
- sections: Section[]
- selectedSectionId: string | null
- selectedClipId: string | null
- currentTime: number
- isPlaying: boolean
- timelineZoom: number (1, 2, 5, or 10)
- previewDimensions: { width: number, height: number }

Actions:
- setSourceVideo
- addSection
- updateSection
- deleteSection
- reorderSections
- selectSection
- addClip
- updateClip
- deleteClip
- selectClip
- setCurrentTime
- setIsPlaying
- setTimelineZoom
- reset

#### 4.2 useProcessingStore

State:
- currentJob: ProcessingJob | null
- processingStatus: string
- progress: number

Actions:
- setCurrentJob
- updateProgress
- clearJob
- reset

### 5. Server Actions

Create actions following patterns from [docs/util.md](docs/util.md):

#### 5.1 Section Actions (`app/editor/[videoId]/section.actions.ts`)

**createSectionAction:**
- Input: videoId, startTime, endTime
- Validation: times are valid, user owns video
- Create section in database via getAuthenticatedClient
- Return: ActionResponse<Section>

**updateSectionAction:**
- Input: sectionId, startTime?, endTime?, order?
- Update section in database
- Return: ActionResponse<Section>

**deleteSectionAction:**
- Input: sectionId
- Delete section and all associated clips
- Return: ActionResponse<void>

**getSectionsAction:**
- Input: videoId
- Return all sections with clips for video
- Return: ActionResponse<Section[]>

#### 5.2 Clip Actions (`app/editor/[videoId]/clip.actions.ts`)

**createClipAction:**
- Input: sectionId, cropX, cropY, cropWidth, cropHeight, previewX, previewY, previewScale
- Generate thumbnail via backend API call
- Create clip in database
- Return: ActionResponse<Clip>

**updateClipAction:**
- Input: clipId, previewX?, previewY?, previewScale?, zIndex?
- Update clip positioning in database
- Return: ActionResponse<Clip>

**deleteClipAction:**
- Input: clipId
- Delete clip from database
- Return: ActionResponse<void>

**generateClipThumbnailAction:**
- Input: videoId, timestamp, cropX, cropY, cropWidth, cropHeight
- Call worker API to generate thumbnail
- Return: ActionResponse<{ thumbnailUrl: string }>

#### 5.3 Processing Actions (`app/editor/[videoId]/processing.actions.ts`)

**startProcessingAction:**
- Input: videoId, sections (with clips)
- Create ProcessingJob in database
- Trigger worker API to start processing
- Return: ActionResponse<ProcessingJob>

**getProcessingStatusAction:**
- Input: jobId
- Query job status from database and worker
- Return: ActionResponse<ProcessingJob>

**cancelProcessingAction:**
- Input: jobId
- Cancel job via worker API
- Update database status
- Return: ActionResponse<void>

### 6. React Query Hooks

Create hooks following patterns from [docs/util.md](docs/util.md):

#### 6.1 Section Hooks (`app/editor/[videoId]/section.hooks.ts`)

**useGetSections:**
- Fetch sections for video
- Update useShortsEditorStore on success
- Invalidate on mutations

**useCreateSection:**
- Call createSectionAction
- Update store on success
- Show toast notification
- Invalidate sections query

**useUpdateSection:**
- Call updateSectionAction
- Optimistic update in store
- Rollback on error

**useDeleteSection:**
- Call deleteSectionAction
- Remove from store on success
- Show confirmation toast

#### 6.2 Clip Hooks (`app/editor/[videoId]/clip.hooks.ts`)

**useCreateClip:**
- Call createClipAction with generateClipThumbnailAction
- Show loading state during thumbnail generation
- Update store on success
- Handle errors with toast

**useUpdateClip:**
- Call updateClipAction
- Optimistic update for smooth UX
- Debounce position/scale updates (500ms)

**useDeleteClip:**
- Call deleteClipAction
- Update store on success

#### 6.3 Processing Hooks (`app/editor/[videoId]/processing.hooks.ts`)

**useStartProcessing:**
- Validate all sections have clips
- Call startProcessingAction
- Update useProcessingStore
- Show processing toast with progress

**useProcessingStatus:**
- Poll getProcessingStatusAction every 2 seconds
- Update progress in store
- Show completion toast
- Handle errors

### 7. Backend Worker API

Extend existing worker infrastructure to handle new processing requirements.

#### 7.1 Thumbnail Generation Endpoint

**POST /api/worker/thumbnail**

Input:
- videoId: string
- timestamp: number
- cropX: number
- cropY: number
- cropWidth: number
- cropHeight: number

Process:
- Download video segment at timestamp (or use cached video)
- Extract frame at timestamp using ffmpeg
- Crop frame to specified coordinates
- Save thumbnail to storage
- Return thumbnail URL

#### 7.2 Shorts Processing Endpoint

**POST /api/worker/process-shorts**

Input:
- jobId: string
- videoId: string
- sections: Array<{
    startTime: number
    endTime: number
    clips: Array<{
      cropX, cropY, cropWidth, cropHeight
      previewX, previewY, previewScale
      zIndex
    }>
  }>

Process for each section:
1. Download section video using yt-dlp (startTime to endTime)
2. Create a single output video for the section where ALL clips play simultaneously:
   - For each clip in the section (sorted by zIndex):
     - Crop from source video at specified coordinates (cropX, cropY, cropWidth, cropHeight)
     - Scale cropped video to preview dimensions based on previewScale
     - Position on portrait canvas (1080x1920) at coordinates (previewX, previewY)
   - All clips are overlaid on the same black background simultaneously
   - Single audio track from the source video section
3. Concatenate all section outputs sequentially
4. Save final video to storage
5. Update job status and progress throughout

**CRITICAL**: All clips within a section must be cropped from the SAME source video segment and play at the SAME time. The result is multiple cropped regions of the same video playing simultaneously in different positions on the portrait canvas.

FFmpeg command structure for a section with 2 clips:
```bash
ffmpeg -ss startTime -to endTime -i source_video.mp4 \
  -filter_complex "\
    color=black:1080x1920:d=duration[bg]; \
    [0:v]crop=cropW1:cropH1:cropX1:cropY1,scale=scaledW1:scaledH1[clip1]; \
    [0:v]crop=cropW2:cropH2:cropX2:cropY2,scale=scaledW2:scaledH2[clip2]; \
    [bg][clip1]overlay=x=previewX1:y=previewY1[tmp]; \
    [tmp][clip2]overlay=x=previewX2:y=previewY2[out] \
  " \
  -map "[out]" -map 0:a section_output.mp4
```

Note: Both [clip1] and [clip2] are cropped from the SAME input video [0:v], ensuring they show different areas of the same footage playing simultaneously.

#### 7.3 Progress Updates

Implement WebSocket or polling mechanism to update job progress:
- Downloading: 0-20%
- Processing sections: 20-80% (divided by section count)
- Concatenating: 80-90%
- Finalizing: 90-100%

### 8. UI/UX Requirements

#### 8.1 Responsive Design

- Desktop: Side-by-side layout (timeline left, preview right)
- Tablet: Stacked layout with collapsible panels
- Mobile: Single column with tabbed interface

#### 8.2 Interactions

- Drag to create section on timeline
- Click timeline to seek video player
- Scroll wheel on timeline to zoom in/out
- Drag timeline playhead to scrub video
- Drag to resize crop frame
- Drag to position clips in preview
- Corner handles to scale clips
- Right-click context menus for quick actions
- Keyboard shortcuts documented in help modal

#### 8.3 Visual Feedback

- Loading states for all async operations
- Progress bars for processing
- Toast notifications for success/error
- Disabled states during processing
- Hover states on interactive elements

#### 8.4 Validation

- Section times must be within video duration
- Section start must be before end
- Crop coordinates must be within video dimensions
- Preview positions must be within preview bounds
- At least one clip required per section
- Maximum 10 sections per video
- Maximum 5 clips per section

### 9. Error Handling

Follow the pattern from [CLAUDE.md](CLAUDE.md): all errors should be thrown, no fallback functionality.

- Display specific error messages in toast notifications
- Log errors using conditionalLog from [lib/log.util.ts](lib/log.util.ts)
- Rollback optimistic updates on mutation failures
- Show retry button for failed operations
- Gracefully handle worker API failures

### 10. Testing Requirements

Document all tests in [Test.md](Test.md) following the format specified in [CLAUDE.md](CLAUDE.md).

#### 10.1 Unit Tests (Jest)

- Section creation with valid/invalid timestamps
- Clip positioning calculations
- Preview dimension calculations
- Store actions and state updates

#### 10.2 Integration Tests (Playwright)

- Complete workflow: create section → create clip → position clip → process video
- Multiple sections with multiple clips
- Error handling scenarios
- Cancelling processing
- Responsive layout on different screen sizes

### 11. Implementation Steps

Complete each step 100% before moving to the next:

1. **Database Schema**: Create Prisma models, generate migration, verify RLS policies
2. **Types**: Define all TypeScript types in appropriate `.types.ts` files
3. **Stores**: Implement Zustand stores with all actions
4. **Server Actions**: Implement all actions with proper error handling
5. **React Query Hooks**: Implement hooks with proper cache invalidation
6. **Worker API - Thumbnails**: Implement thumbnail generation endpoint
7. **Worker API - Processing**: Implement shorts processing endpoint
8. **Components - SectionManager**: Build timeline and section management UI
9. **Components - ClipCreator**: Build crop frame and clip creation UI
10. **Components - PreviewWindow**: Build portrait preview with positioning
11. **Components - ClipsList**: Build clip list with controls
12. **Page Integration**: Integrate all components into editor page
13. **Keyboard Shortcuts**: Implement and document shortcuts
14. **Responsive Design**: Ensure all breakpoints work correctly
15. **Testing**: Write and run all tests, document in Test.md
16. **Code Review**: Review all generated code against [CLAUDE.md](CLAUDE.md) and [docs/util.md](docs/util.md) patterns

## Code Quality Checklist

After implementation, verify:

- [ ] All files follow naming conventions from [CLAUDE.md](CLAUDE.md)
- [ ] No comments in any files
- [ ] All console.logs use conditionalLog with appropriate labels
- [ ] All errors are thrown, no fallback functionality
- [ ] cn utility used for class concatenation
- [ ] Types defined from @prisma/client where applicable
- [ ] Actions use getAuthenticatedClient pattern
- [ ] Hooks use react-query with proper store updates
- [ ] Loading/error states managed by react-query, not stores
- [ ] Server actions have "use server" directive
- [ ] Client components have "use client" directive
- [ ] All async operations have proper error handling
- [ ] Responsive design works on all breakpoints
- [ ] Tests documented in Test.md with proper format
- [ ] No hardcoded values, use constants/config
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Performance: debounced updates, optimistic UI
- [ ] Security: input validation, RLS enforcement

## Additional Considerations

### Performance Optimization

- Implement virtual scrolling for section/clip lists if needed
- Cache video frames for quick thumbnail generation
- Use Web Workers for heavy client-side calculations
- Optimize FFmpeg filters for faster processing
- Implement video segment caching in worker

### Future Enhancements (Not Required Now)

- Transitions between sections
- Text overlays on clips
- Audio mixing and effects
- Clip rotation and filters
- Templates for common layouts
- Batch processing multiple videos
- Export presets (TikTok, YouTube Shorts, Instagram Reels)

## Success Criteria

The implementation is complete when:

1. User can create multiple sections from source video
2. User can create multiple clips per section with crop frames
3. User can position and scale clips in portrait preview
4. Preview accurately represents final video layout
5. Processing generates correct portrait video with all clips positioned
6. All error cases handled gracefully
7. All tests pass and documented
8. Code follows all patterns from [CLAUDE.md](CLAUDE.md) and [docs/util.md](docs/util.md)
9. UI is responsive and accessible
10. Performance is acceptable (processing time < 2x video duration)
