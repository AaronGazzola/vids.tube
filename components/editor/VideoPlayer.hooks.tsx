import { useEffect, useRef, useState } from "react";
import { loadYouTubeAPI } from "@/lib/youtube-player";
import {
  YouTubePlayer,
  PlayerState,
  PlayerStateMap,
  PlayerReadyEvent,
  PlayerStateChangeEvent,
  PlayerErrorEvent,
} from "@/lib/youtube-player.types";
import { VideoPlayerProps } from "./VideoPlayer.types";

export const useYouTubePlayer = ({
  videoId,
  onReady,
  onStateChange,
  onError,
}: VideoPlayerProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const initializePlayer = async () => {
      await loadYouTubeAPI();

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const player = new window.YT.Player(containerRef.current!, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          fs: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: PlayerReadyEvent) => {
            setIsReady(true);
            onReady?.(event.target);
          },
          onStateChange: (event: PlayerStateChangeEvent) => {
            const state: PlayerState = PlayerStateMap[event.data];
            onStateChange?.(state);
          },
          onError: (event: PlayerErrorEvent) => {
            onError?.(event.data);
          },
        },
      });

      playerRef.current = player;
    };

    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsReady(false);
    };
  }, [videoId, onReady, onStateChange, onError]);

  const play = () => {
    if (playerRef.current && isReady) {
      playerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (playerRef.current && isReady) {
      playerRef.current.pauseVideo();
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  const getCurrentTime = (): number => {
    if (playerRef.current && isReady) {
      return playerRef.current.getCurrentTime();
    }
    return 0;
  };

  const getDuration = (): number => {
    if (playerRef.current && isReady) {
      return playerRef.current.getDuration();
    }
    return 0;
  };

  return {
    containerRef,
    player: playerRef.current,
    isReady,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration,
  };
};
