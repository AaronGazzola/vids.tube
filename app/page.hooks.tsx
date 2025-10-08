'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export function useKeyboardShortcuts() {
  const { togglePlayback, skipForward, skipBackward, seekTo, currentTime } = useEditorStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            skipForward(5);
          } else {
            skipForward(1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            skipBackward(5);
          } else {
            skipBackward(1);
          }
          break;
        case 'Home':
          e.preventDefault();
          seekTo(0);
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const fraction = parseInt(e.key) / 10;
            const duration = useEditorStore.getState().duration;
            seekTo(duration * fraction);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, skipForward, skipBackward, seekTo, currentTime]);
}
