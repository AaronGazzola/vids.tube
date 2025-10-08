'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoInput } from './VideoInput.hooks';
import type { VideoInputProps } from './VideoInput.types';

export function VideoInput({ className }: VideoInputProps) {
  const {
    state,
    handleUrlChange,
    handlePaste,
    handleSubmit,
    handleClear,
    handleBlur,
  } = useVideoInput();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube URL here..."
          value={state.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          className="flex-1"
        />
        <Button onClick={handlePaste} variant="outline" type="button">
          Paste
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={state.isLoading || !state.url.trim()}
          type="button"
        >
          {state.isLoading ? 'Loading...' : 'Load'}
        </Button>
        {state.url && (
          <Button onClick={handleClear} variant="destructive" type="button">
            Clear
          </Button>
        )}
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </div>
  );
}
