import { useState } from 'react';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { useEditorStore } from '@/store/useEditorStore';
import type { VideoInputState } from './VideoInput.types';

export function useVideoInput() {
  const [state, setState] = useState<VideoInputState>({
    url: '',
    error: null,
    isLoading: false,
  });

  const setVideoUrl = useEditorStore((store) => store.setVideoUrl);
  const clearVideo = useEditorStore((store) => store.clearVideo);

  const handleUrlChange = (url: string) => {
    setState((prev) => ({ ...prev, url, error: null }));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Failed to read clipboard',
      }));
    }
  };

  const handleSubmit = () => {
    if (!state.url.trim()) {
      setState((prev) => ({ ...prev, error: 'Please enter a URL' }));
      return;
    }

    if (!isValidYouTubeUrl(state.url)) {
      setState((prev) => ({ ...prev, error: 'Invalid YouTube URL' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setVideoUrl(state.url);
    setState((prev) => ({ ...prev, isLoading: false }));
  };

  const handleClear = () => {
    setState({ url: '', error: null, isLoading: false });
    clearVideo();
  };

  const handleBlur = () => {
    if (state.url.trim() && !isValidYouTubeUrl(state.url)) {
      setState((prev) => ({ ...prev, error: 'Invalid YouTube URL' }));
    }
  };

  return {
    state,
    handleUrlChange,
    handlePaste,
    handleSubmit,
    handleClear,
    handleBlur,
  };
}
