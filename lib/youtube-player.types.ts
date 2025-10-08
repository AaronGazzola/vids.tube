export type PlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued";

export interface PlayerStateChangeEvent {
  data: number;
}

export interface PlayerReadyEvent {
  target: YouTubePlayer;
}

export interface PlayerErrorEvent {
  data: number;
}

export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

export interface PlayerConfig {
  height: string | number;
  width: string | number;
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
  };
  events?: {
    onReady?: (event: PlayerReadyEvent) => void;
    onStateChange?: (event: PlayerStateChangeEvent) => void;
    onError?: (event: PlayerErrorEvent) => void;
  };
}

export const PlayerStateMap: Record<number, PlayerState> = {
  [-1]: "unstarted",
  [0]: "ended",
  [1]: "playing",
  [2]: "paused",
  [3]: "buffering",
  [5]: "cued",
};

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: PlayerConfig
      ) => YouTubePlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
      loaded?: number;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
