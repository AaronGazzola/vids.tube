# YouTube Clip Editor UI - Implementation Roadmap

**Created:** 2025-10-08
**Scope:** YouTube clip editing interface UI implementation
**Goal:** Enable users to paste YouTube URLs, position a vertical crop frame, select clip timestamps, and manage clips in a sidebar

## Overview

This roadmap focuses exclusively on the frontend UI implementation for the YouTube clip editor. No backend processing or video compilation functionality is included in this phase.

## Phase 1: Project Setup and Core Dependencies ✅

### 1.1 Install Required Dependencies ✅

- [x] Install Zustand for state management: `npm install zustand`
- [x] Install React Query: `npm install @tanstack/react-query`
- [x] Install YouTube Player API types: `npm install --save-dev @types/youtube`
- [x] Verify shadcn/ui components availability

### 1.2 Environment Configuration ✅

- [x] Add YouTube-related environment variables to `.env.local`
- [x] Configure TypeScript for YouTube Player API types
- [x] Update `next.config.js` to allow YouTube iframe embeds

### 1.3 Create Base File Structure ✅

- [x] Create `lib/youtube.ts` for YouTube URL utilities
- [x] Create `store/useEditorStore.ts` for Zustand state management
- [x] Create `components/editor/` directory for editor components
- [x] Create `app/editor/` directory for editor page

## Phase 2: YouTube URL Input and Validation ✅

### 2.1 YouTube Utility Functions ✅

- [x] Implement `extractVideoId(url: string): string | null` in `lib/youtube.ts`
  - Extract video ID from various YouTube URL formats
  - Support youtube.com, youtu.be, with/without www
  - Support with/without query parameters
- [x] Implement `isValidYouTubeUrl(url: string): boolean` in `lib/youtube.ts`
  - Validate URL format using regex
  - Return boolean for valid/invalid URLs
- [x] Create `YouTubeUrlSchema` type in `lib/youtube.types.ts`
  - Define interface for parsed YouTube URL data

### 2.2 Video Input Component ✅

- [x] Create `components/editor/VideoInput.tsx`
  - Text input field for YouTube URL
  - Paste button with clipboard API integration
  - Clear/reset button
  - Loading state indicator
- [x] Create `components/editor/VideoInput.hooks.tsx`
  - `useVideoInput()` hook for managing input state
  - URL validation on blur/submit
  - Error handling for invalid URLs
- [x] Create `components/editor/VideoInput.types.ts`
  - Define component prop types
  - Define input state interface

### 2.3 Integration with Store ✅

- [x] Add `videoUrl` to Zustand store
- [x] Add `videoId` to Zustand store
- [x] Add `setVideoUrl(url: string)` action to store
- [x] Add `clearVideo()` action to store

## Phase 3: YouTube Player Integration ✅

### 3.1 YouTube Player Setup ✅

- [x] Create `lib/youtube-player.ts` utility
  - Initialize YouTube IFrame Player API
  - Load API script dynamically
  - Handle API ready state
- [x] Create `lib/youtube-player.types.ts`
  - Define player state interfaces
  - Define player event types
  - Define player configuration options

### 3.2 Video Player Component ✅

- [x] Create `components/editor/VideoPlayer.tsx`
  - Container div with responsive dimensions
  - YouTube iframe embed with player ID
  - Player initialization on mount
  - Player cleanup on unmount
- [x] Create `components/editor/VideoPlayer.hooks.tsx`
  - `useYouTubePlayer()` hook for player instance management
  - Handle player state changes (playing, paused, ended)
  - Handle player ready event
  - Expose player methods (play, pause, seekTo, getCurrentTime)
- [x] Create `components/editor/VideoPlayer.types.ts`
  - Define player component props
  - Define player state interface

### 3.3 Player Controls Integration ✅

- [x] Add `isPlaying` to Zustand store
- [x] Add `currentTime` to Zustand store
- [x] Add `duration` to Zustand store
- [x] Add `setIsPlaying(playing: boolean)` action
- [x] Add `setCurrentTime(time: number)` action
- [x] Add `setDuration(duration: number)` action

## Phase 4: Crop Frame Implementation ✅

### 4.1 Crop Frame Component ✅

- [x] Create `components/editor/CropFrame.tsx`
  - Absolute positioned overlay div
  - Border styling for 9:16 aspect ratio frame
  - Semi-transparent background outside frame
  - Corner and edge resize handles
  - Center drag handle for positioning
- [x] Create `components/editor/CropFrame.types.ts`
  - Define `CropPosition` interface (x, y, width, height)
  - Define frame bounds constraints
  - Define resize/drag event types

### 4.2 Drag and Resize Logic ✅

- [x] Create `components/editor/CropFrame.hooks.tsx`
  - `useDragFrame()` hook for drag functionality
    - Track mouse down/move/up events
    - Calculate new x/y position
    - Constrain to video boundaries
    - Update position during drag
  - `useResizeFrame()` hook for resize functionality
    - Track resize handle mouse events
    - Calculate new width/height maintaining 9:16 ratio
    - Constrain to video boundaries
    - Prevent frame from going outside video
  - `useCropFramePosition()` hook to sync with store

### 4.3 Frame Position Store Integration ✅

- [x] Add `cropFrame` object to Zustand store
  - `x: number` (pixels from left)
  - `y: number` (pixels from top)
  - `width: number` (pixels)
  - `height: number` (pixels, calculated from width \* 16/9)
- [x] Add `setCropFrame(position: CropPosition)` action
- [x] Add `resetCropFrame()` action to center and default size

### 4.4 Visual Overlay ✅

- [x] Create overlay showing cropped area
  - Dark semi-transparent mask outside frame
  - Clear view inside frame
  - Grid lines for alignment (optional)
- [x] Add visual feedback during drag/resize
  - Highlight active handles
  - Show dimension tooltip during resize
  - Snap guides for centering (optional)

## Phase 5: Timeline and Playback Controls ✅

### 5.1 Timeline Controls Component ✅

- [x] Create `components/editor/TimelineControls.tsx`
  - Progress bar showing current position
  - Clickable seek bar
  - Time display (current / total)
  - Play/pause button
  - Frame-by-frame navigation buttons (±1 second)
- [x] Create `components/editor/TimelineControls.hooks.tsx`
  - `useTimelineControls()` hook
    - Handle seek bar clicks
    - Calculate time from click position
    - Update player current time
    - Sync with player state
- [x] Create `components/editor/TimelineControls.types.ts`
  - Define timeline component props
  - Define seek event types

### 5.2 Time Format Utilities ✅

- [x] Create `lib/time.utils.ts`
  - `formatTime(seconds: number): string` (MM:SS or HH:MM:SS)
  - `parseTime(formatted: string): number`
  - `formatDuration(seconds: number): string`

### 5.3 Playback Control Actions ✅

- [x] Add `togglePlayback()` action to store
- [x] Add `seekTo(time: number)` action to store
- [x] Add `skipForward(seconds: number)` action to store
- [x] Add `skipBackward(seconds: number)` action to store

## Phase 6: Clip Creation Interface

### 6.1 Clip Creator Component

- [ ] Create `components/editor/ClipCreator.tsx`
  - "Set Start" button (uses current time)
  - "Set End" button (uses current time)
  - Manual timestamp inputs (start/end)
  - Duration display (end - start)
  - "Add Clip" button (primary action)
  - Validation messages (start < end, duration > 0)
- [ ] Create `components/editor/ClipCreator.hooks.tsx`
  - `useClipCreator()` hook
    - Manage start/end timestamp state
    - Validate timestamps
    - Create clip object with current crop frame
    - Reset after adding clip
- [ ] Create `components/editor/ClipCreator.types.ts`
  - Define clip creator component props
  - Define validation error types

### 6.2 Clip Data Structure

- [ ] Create `lib/clip.types.ts`
  - Define `Clip` interface:
    - `id: string` (unique identifier)
    - `startTime: number` (seconds)
    - `endTime: number` (seconds)
    - `duration: number` (calculated)
    - `cropX: number` (pixels)
    - `cropY: number` (pixels)
    - `cropWidth: number` (pixels)
    - `cropHeight: number` (pixels)
    - `createdAt: number` (timestamp)

### 6.3 Clip Store Actions

- [ ] Add `clips: Clip[]` array to Zustand store
- [ ] Add `addClip(clip: Omit<Clip, 'id' | 'createdAt'>)` action
  - Generate unique ID
  - Add timestamp
  - Append to clips array
- [ ] Add `removeClip(id: string)` action
- [ ] Add `updateClip(id: string, updates: Partial<Clip>)` action
- [ ] Add `reorderClips(startIndex: number, endIndex: number)` action
- [ ] Add `clearClips()` action

## Phase 7: Clips List Sidebar

### 7.1 Clips List Component

- [ ] Create `components/editor/ClipsList.tsx`
  - Sidebar container with scrollable area
  - Header with clip count
  - "Clear All" button
  - Empty state message when no clips
  - List of clip items
- [ ] Create `components/editor/ClipsList.types.ts`
  - Define clips list component props
  - Define list item props

### 7.2 Clip Item Component

- [ ] Create `components/editor/ClipItem.tsx`
  - Thumbnail preview (YouTube thumbnail with timestamp)
  - Clip number/index
  - Start/end timestamps display
  - Duration badge
  - Crop position indicator (visual)
  - Edit button
  - Delete button
  - Drag handle for reordering
- [ ] Create `components/editor/ClipItem.hooks.tsx`
  - `useClipItem()` hook
    - Handle edit click (load into editor)
    - Handle delete click (with confirmation)
    - Handle thumbnail generation
- [ ] Create `components/editor/ClipItem.types.ts`
  - Define clip item component props

### 7.3 Clip List Interactions

- [ ] Implement drag-and-drop reordering
  - Install or implement DnD library
  - Add drag handlers to clip items
  - Update clips array order in store
  - Visual feedback during drag
- [ ] Implement edit functionality
  - Load clip data into editor
  - Set crop frame to clip's crop position
  - Set timeline to clip's start time
  - Highlight timestamp range
- [ ] Implement delete functionality
  - Show confirmation dialog (use shadcn/ui dialog)
  - Remove clip from store
  - Show success toast

### 7.4 Clip Visualization

- [ ] Add visual indicators
  - Timeline markers for each clip
  - Color-coded clips
  - Active/selected clip highlight
- [ ] Add preview functionality
  - Click to preview clip
  - Jump to clip start time
  - Highlight crop area for clip

## Phase 8: Main Editor Layout

### 8.1 Editor Page Component

- [ ] Create `app/editor/page.tsx`
  - Two-column layout (main + sidebar)
  - Main area: VideoInput + VideoPlayer + CropFrame + TimelineControls
  - Sidebar: ClipCreator + ClipsList
  - Responsive breakpoints
- [ ] Create `app/editor/page.types.ts`
  - Define page-level state types
  - Define layout configuration types

### 8.2 Layout Components

- [ ] Create `components/editor/EditorLayout.tsx`
  - Responsive grid/flex layout
  - Sidebar toggle for mobile
  - Header with app branding
  - Footer with action buttons
- [ ] Create `components/editor/EditorLayout.types.ts`
  - Define layout component props

### 8.3 Responsive Design

- [ ] Implement mobile layout
  - Stacked layout for small screens
  - Collapsible sidebar
  - Touch-friendly controls
  - Optimized crop frame for touch
- [ ] Implement tablet layout
  - Side-by-side with reduced sidebar
  - Touch and mouse support
- [ ] Implement desktop layout
  - Full side-by-side layout
  - Keyboard shortcuts support

## Phase 9: State Management and Persistence

### 9.1 Zustand Store Implementation

- [ ] Create `store/useEditorStore.ts`
- [ ] Define complete store interface:
  ```typescript
  interface EditorStore {
    videoUrl: string | null;
    videoId: string | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    cropFrame: CropPosition;
    clips: Clip[];
    setVideoUrl: (url: string) => void;
    clearVideo: () => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setCropFrame: (position: CropPosition) => void;
    resetCropFrame: () => void;
    addClip: (clip: Omit<Clip, "id" | "createdAt">) => void;
    removeClip: (id: string) => void;
    updateClip: (id: string, updates: Partial<Clip>) => void;
    reorderClips: (startIndex: number, endIndex: number) => void;
    clearClips: () => void;
    togglePlayback: () => void;
    seekTo: (time: number) => void;
    resetEditor: () => void;
  }
  ```
- [ ] Implement all store actions
- [ ] Add computed/derived state selectors

### 9.2 LocalStorage Persistence

- [ ] Implement persistence middleware
  - Save state to localStorage on changes
  - Debounce saves (500ms)
  - Restore state on mount
- [ ] Define what to persist:
  - videoUrl, videoId
  - clips array
  - cropFrame position
- [ ] Define what NOT to persist:
  - isPlaying, currentTime (playback state)
  - UI-only state

### 9.3 Store Hooks and Selectors

- [ ] Create selective store hooks
  - `useVideoState()` - video-related state only
  - `usePlaybackState()` - playback-related state only
  - `useCropFrame()` - crop frame state only
  - `useClips()` - clips array and actions
- [ ] Optimize re-renders with shallow equality checks

## Phase 10: Error Handling and Validation

### 10.1 Input Validation

- [ ] Validate YouTube URL format
  - Show inline error messages
  - Clear errors on valid input
- [ ] Validate clip timestamps
  - Ensure start < end
  - Ensure timestamps within video duration
  - Ensure minimum clip duration (e.g., 1 second)
  - Show validation errors below inputs

### 10.2 Error States

- [ ] Create `components/editor/ErrorMessage.tsx`
  - Generic error display component
  - Retry action button
  - Dismiss button
- [ ] Handle YouTube Player errors
  - Video not available
  - Embedding disabled
  - Age-restricted content
  - Network errors
- [ ] Create error boundaries
  - Wrap main editor in error boundary
  - Fallback UI for crashes
  - Error logging

### 10.3 Loading States

- [ ] Create loading skeletons
  - Video player loading skeleton
  - Clips list loading skeleton
  - Timeline controls skeleton
- [ ] Add loading indicators
  - Video loading spinner
  - Clip thumbnail loading
  - Action button loading states

## Phase 11: UI Polish and UX Enhancements

### 11.1 Animations and Transitions

- [ ] Add smooth transitions
  - Crop frame drag/resize animations
  - Sidebar slide animations
  - Clip list item animations
  - Button hover/active states
- [ ] Add micro-interactions
  - Button click feedback
  - Input focus animations
  - Success/error toast animations

### 11.2 Keyboard Shortcuts

- [ ] Implement keyboard shortcuts
  - Space: Play/pause
  - Left/Right arrows: Skip backward/forward
  - I: Set clip start (In point)
  - O: Set clip end (Out point)
  - Enter: Add clip
  - Delete: Remove selected clip
- [ ] Create keyboard shortcuts help modal
  - Show all available shortcuts
  - Accessible via `?` key

### 11.3 Accessibility

- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
  - Tab order makes sense
  - Focus visible indicators
  - Skip links for screen readers
- [ ] Add screen reader announcements
  - Clip added/removed announcements
  - Playback state changes
  - Error messages
- [ ] Ensure color contrast meets WCAG AA standards

### 11.4 Visual Design

- [ ] Design crop frame styling
  - Clean border design
  - Clear handle indicators
  - Professional overlay mask
- [ ] Design timeline controls
  - Modern progress bar
  - Clear time display
  - Icon buttons for actions
- [ ] Design clips sidebar
  - Card-based clip items
  - Thumbnail with overlay info
  - Clear action buttons
- [ ] Apply consistent spacing and typography
