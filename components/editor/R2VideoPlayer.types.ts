export interface R2VideoPlayerProps {
  storageUrl: string;
  onReady?: (element: HTMLVideoElement) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
}
