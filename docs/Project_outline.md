# vids.tube - Technical Implementation Outline

## Overview

vids.tube is a web application that allows users to create YouTube Shorts from long-form YouTube content by cropping and clipping videos into portrait-oriented segments. The app operates entirely client-side until final video processing, requiring no authentication.

## Core Technologies (MVP)

### Frontend Framework
- **Next.js 15** (App Router) - Server components and client components for optimal performance
- **React 19** - UI components and state management
- **TypeScript** - Type safety

### Styling
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Pre-built accessible components

### State Management
- **Zustand** - Lightweight state management for:
  - YouTube video URL/metadata
  - Clip collection (crop positions, timestamps)
  - Editor state (current frame position, playback state)

### Data Fetching
- **React Query** - Caching and managing:
  - YouTube video metadata
  - Video processing job status

### Video Processing
- **FFmpeg.wasm** - Client-side video processing for:
  - Real-time preview of crop frame
  - Initial video loading and metadata extraction

### Backend API
- **Next.js API Routes** - Serverless functions for:
  - YouTube video metadata fetching (using youtube-dl or similar)
  - Triggering video processing jobs
  - Polling job status

### Video Processing Backend
- **Supabase Storage** - Temporary storage for:
  - Source video downloads from YouTube
  - Processed clip outputs
  - Final compiled video

- **Supabase Edge Functions** - Serverless video processing:
  - Download YouTube video
  - Process clips using FFmpeg (crop, trim)
  - Concatenate clips into final video
  - Generate download URL with expiration

### Database
- **Prisma ORM** with **PostgreSQL** (via Supabase) - Minimal schema for:
  - Video processing jobs
  - Job status tracking
  - Temporary file references (auto-cleanup after 24h)

**Note:** No user authentication required - jobs are tracked via unique job IDs.

## Architecture Flow

### Phase 1: Video Selection & Loading
1. User pastes YouTube URL into input field
2. Frontend validates URL format
3. API route fetches video metadata (title, duration, thumbnail) via youtube-dl
4. Video preview loaded in iframe or via YouTube Player API
5. Video metadata stored in Zustand state

### Phase 2: Crop Frame Editor
1. Video player rendered with portrait crop frame overlay
2. Crop frame component:
   - Draggable handles for repositioning (x, y coordinates)
   - Corner handles for scaling (width, height)
   - Maintains 9:16 aspect ratio
   - Visual overlay showing cropped area
   - Coordinates stored relative to video dimensions
3. Video playback controls:
   - Play/pause
   - Seek bar with timestamp display
   - Frame-by-frame navigation buttons
4. Current crop frame state stored in Zustand

### Phase 3: Clip Creation
1. User sets start timestamp (current playback position or manual input)
2. User sets end timestamp (current playback position or manual input)
3. User clicks "Add Clip" button
4. Clip object created with:
   ```typescript
   interface Clip {
     id: string;
     startTime: number; // seconds
     endTime: number; // seconds
     cropX: number; // pixels from left
     cropY: number; // pixels from top
     cropWidth: number; // pixels
     cropHeight: number; // pixels (maintains 9:16 ratio)
   }
   ```
5. Clip added to clips array in Zustand store
6. User can create multiple clips with different timestamps and crop positions

### Phase 4: Clip Management
1. Sidebar displays list of created clips
2. Each clip shows:
   - Thumbnail preview
   - Start/end timestamps
   - Duration
3. Clip actions:
   - Edit (loads clip into editor)
   - Delete (removes from list)
   - Reorder (drag-and-drop to change sequence)
4. Clips array managed in Zustand

### Phase 5: Video Compilation & Download
1. User clicks "Create Short" button
2. Frontend validation:
   - At least one clip exists
   - All clips have valid timestamps
3. Frontend sends job request to API route:
   ```typescript
   POST /api/process-video
   {
     youtubeUrl: string;
     clips: Clip[];
   }
   ```
4. API route:
   - Creates job record in database via Prisma
   - Returns job ID to frontend
5. Supabase Edge Function triggered:
   - Downloads YouTube video to Supabase Storage
   - Processes each clip:
     - Extract segment (start/end time)
     - Apply crop filter (x, y, width, height)
     - Scale to 1080x1920 (9:16)
   - Concatenate all clips into single video
   - Upload final video to Supabase Storage
   - Generate signed URL (1 hour expiration)
   - Update job status to "completed"
6. Frontend polls job status:
   ```typescript
   GET /api/job-status/:jobId
   ```
7. When complete, download button appears with signed URL
8. User clicks download to save video

### Phase 6: Cleanup
1. Scheduled job (daily) deletes:
   - Job records older than 24 hours
   - Associated files in Supabase Storage

## Database Schema

```prisma
model VideoJob {
  id          String   @id @default(cuid())
  youtubeUrl  String
  clips       Json     // Array of Clip objects
  status      String   // 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl    String?  // Signed URL for download
  error       String?
  createdAt   DateTime @default(now())
  expiresAt   DateTime // Auto-delete after 24h
}
```

## File Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main editor page
│   ├── api/
│   │   ├── process-video/
│   │   │   └── route.ts        # Video processing job creation
│   │   └── job-status/
│   │       └── [id]/route.ts   # Job status polling
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn components
│   ├── VideoInput.tsx          # YouTube URL input
│   ├── VideoPlayer.tsx         # Video preview with crop overlay
│   ├── CropFrame.tsx           # Draggable/resizable crop frame
│   ├── TimelineControls.tsx    # Playback and timestamp controls
│   ├── ClipCreator.tsx         # Start/end time inputs and Add Clip button
│   ├── ClipsList.tsx           # Sidebar with clip management
│   └── DownloadButton.tsx      # Final video download
├── lib/
│   ├── utils.ts                # cn() utility
│   ├── youtube.ts              # YouTube URL validation, metadata fetching
│   └── ffmpeg.ts               # FFmpeg.wasm initialization (client-side preview)
├── store/
│   └── useEditorStore.ts       # Zustand store for editor state
├── prisma/
│   └── schema.prisma           # Database schema
└── supabase/
    └── functions/
        └── process-clips/      # Edge function for video processing
            └── index.ts
```

## Key Implementation Details

### YouTube Video Handling
- Use YouTube Player API for preview (avoids downloading full video client-side)
- Extract video metadata via API route using youtube-dl or similar
- Video only downloaded server-side when user submits for processing

### Crop Frame Implementation
- HTML canvas or div overlay positioned absolutely over video
- Mouse/touch event handlers for drag and resize
- Constrain frame to video boundaries
- Maintain 9:16 aspect ratio during resize
- Store coordinates relative to original video dimensions

### FFmpeg Processing (Server-side)
```bash
# Per clip:
ffmpeg -i input.mp4 \
  -ss {startTime} -to {endTime} \
  -vf "crop={cropWidth}:{cropHeight}:{cropX}:{cropY}, scale=1080:1920" \
  -c:a copy \
  clip_{n}.mp4

# Concatenation:
ffmpeg -f concat -i clips.txt -c copy output.mp4
```

### State Management Pattern
- Single Zustand store for all editor state
- Clips stored as array with unique IDs
- Optimistic updates for clip management
- Persist state to localStorage for draft recovery

### API Rate Limiting
- Implement rate limiting on API routes to prevent abuse
- Maximum 10 clips per compilation
- Maximum video length: 30 minutes
- Maximum final short length: 3 minutes

## MVP Exclusions

The following features are **NOT** included in the MVP:
- User authentication/accounts
- Video uploads (YouTube URLs only)
- Advanced editing (transitions, filters, text overlays)
- Audio editing or mixing
- Social media integration
- Video history or saved projects
- Real-time collaboration
- Custom aspect ratios (only 9:16)
- Video quality selection
- Background music library
- Analytics or usage tracking

## Environment Variables

```env
YOUTUBE_API_KEY=         # For metadata fetching (optional, fallback to youtube-dl)
SUPABASE_URL=            # Supabase project URL
SUPABASE_ANON_KEY=       # Supabase anonymous key
SUPABASE_SERVICE_KEY=    # For server-side operations
DATABASE_URL=            # PostgreSQL connection string
```

## Deployment Considerations

- **Frontend:** Vercel (optimized for Next.js)
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Processing:** Supabase Edge Functions with FFmpeg
- **CDN:** Cloudflare (for video delivery)

## Performance Optimizations

1. Lazy load video player only after URL validation
2. Debounce crop frame updates to reduce re-renders
3. Use React Query for automatic refetching and caching
4. Implement skeleton loaders during video metadata fetch
5. Stream video processing updates via Server-Sent Events
6. Compress final video output for faster downloads
