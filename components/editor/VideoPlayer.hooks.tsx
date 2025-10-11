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
import { useEditorStore } from "@/store/useEditorStore";

export const useYouTubePlayer = ({
  videoId,
  onReady,
  onStateChange,
  onError,
}: VideoPlayerProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCurrentTime, setDuration, setIsPlaying, setVideoDimensions, setPlayerInstance } = useEditorStore();

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
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: PlayerReadyEvent) => {
            setIsReady(true);
            const duration = event.target.getDuration();
            setDuration(duration);

            const iframe = event.target.getIframe();
            if (iframe) {
              const iframeWidth = iframe.clientWidth;
              const iframeHeight = iframe.clientHeight;
              const videoAspectRatio = 16 / 9;
              const containerAspectRatio = iframeWidth / iframeHeight;

              let videoWidth: number;
              let videoHeight: number;

              if (containerAspectRatio > videoAspectRatio) {
                videoHeight = iframeHeight;
                videoWidth = videoHeight * videoAspectRatio;
              } else {
                videoWidth = iframeWidth;
                videoHeight = videoWidth / videoAspectRatio;
              }

              setVideoDimensions(Math.round(videoWidth), Math.round(videoHeight));
            }

            onReady?.(event.target);
          },
          onStateChange: (event: PlayerStateChangeEvent) => {
            const state: PlayerState = PlayerStateMap[event.data];
            setIsPlaying(state === "playing");
            onStateChange?.(state);
          },
          onError: (event: PlayerErrorEvent) => {
            onError?.(event.data);
          },
        },
      });

      playerRef.current = player;
      setPlayerInstance(player);
    };

    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setPlayerInstance(null);
      setIsReady(false);
    };
  }, [videoId, onReady, onStateChange, onError, setDuration, setIsPlaying, setVideoDimensions, setPlayerInstance]);

  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        setCurrentTime(currentTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isReady, setCurrentTime]);

  return {
    containerRef,
    player: playerRef.current,
    isReady,
  };
};
