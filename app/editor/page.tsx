'use client';

import { useState } from 'react';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { VideoInput } from '@/components/editor/VideoInput';
import { VideoPlayer } from '@/components/editor/VideoPlayer';
import { CropFrame } from '@/components/editor/CropFrame';
import { TimelineControls } from '@/components/editor/TimelineControls';
import { ClipCreator } from '@/components/editor/ClipCreator';
import { ClipsList } from '@/components/editor/ClipsList';
import { useEditorStore } from '@/store/useEditorStore';
import { useKeyboardShortcuts } from './page.hooks';

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoId = useEditorStore((state) => state.videoId);

  useKeyboardShortcuts();

  return (
    <EditorLayout>
      <main className="flex-1 flex flex-col overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <VideoInput />

          {videoId && (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <VideoPlayer />
                <CropFrame />
              </div>

              <TimelineControls />
            </>
          )}
        </div>
      </main>

      <EditorLayout.Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
        <div className="space-y-6">
          {videoId && <ClipCreator />}
          <ClipsList />
        </div>
      </EditorLayout.Sidebar>
    </EditorLayout>
  );
}
