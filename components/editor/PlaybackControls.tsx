"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { formatTime } from "./PlaybackControls.utils";

export const PlaybackControls = () => {
  const playerInstance = useEditorStore((state) => state.playerInstance);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const currentTime = useEditorStore((state) => state.currentTime);
  const duration = useEditorStore((state) => state.duration);

  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking]);

  const handlePlayPause = () => {
    if (!playerInstance) return;
    if (isPlaying) {
      playerInstance.pauseVideo();
    } else {
      playerInstance.playVideo();
    }
  };

  const handleSeekStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSeekValue(Number(e.target.value));
  };

  const handleSeekEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerInstance) return;
    const time = Number(e.target.value);
    playerInstance.seekTo(time, true);
    setSeekValue(time);
    setIsSeeking(false);
  };

  const handleSkipBackward = () => {
    if (!playerInstance) return;
    const newTime = Math.max(0, currentTime - 5);
    playerInstance.seekTo(newTime, true);
  };

  const handleSkipForward = () => {
    if (!playerInstance) return;
    const newTime = Math.min(duration, currentTime + 5);
    playerInstance.seekTo(newTime, true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerInstance) return;
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    playerInstance.setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      playerInstance.unMute();
    }
  };

  const handleMuteToggle = () => {
    if (!playerInstance) return;
    if (isMuted) {
      playerInstance.unMute();
      setIsMuted(false);
    } else {
      playerInstance.mute();
      setIsMuted(true);
    }
  };

  if (!playerInstance) return null;

  const progress = duration > 0 ? (seekValue / duration) * 100 : 0;

  return (
    <div className="w-full bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
      <div className="relative w-full h-1 bg-white/10 rounded-full group cursor-pointer">
        <div
          className="absolute h-full bg-white rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={seekValue}
          onChange={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute h-3 w-3 bg-white rounded-full top-1/2 -translate-y-1/2 transition-all shadow-lg shadow-white/50 opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipBackward}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Skip backward 5 seconds"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 bg-white hover:bg-white/90 rounded-lg transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-black fill-black" />
            ) : (
              <Play className="w-6 h-6 text-black fill-black" />
            )}
          </button>

          <button
            onClick={handleSkipForward}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Skip forward 5 seconds"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>

          <div className="ml-2 text-sm font-mono text-white/90">
            {formatTime(seekValue)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMuteToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <div className="relative w-24 h-1 bg-white/10 rounded-full group cursor-pointer">
            <div
              className="absolute h-full bg-white rounded-full transition-all"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-3 w-3 bg-white rounded-full top-1/2 -translate-y-1/2 transition-all shadow-lg shadow-white/50 opacity-0 group-hover:opacity-100"
              style={{ left: `calc(${isMuted ? 0 : volume}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
