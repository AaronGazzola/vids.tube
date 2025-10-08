import { YouTubePlayer, PlayerState } from "@/lib/youtube-player.types";

export interface VideoPlayerProps {
  videoId: string;
  onReady?: (player: YouTubePlayer) => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (errorCode: number) => void;
}

export interface PlayerInstance {
  player: YouTubePlayer | null;
  isReady: boolean;
}
