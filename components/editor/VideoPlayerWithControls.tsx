"use client";

import { PlaybackControls } from "./PlaybackControls";
import { VideoPlayer } from "./VideoPlayer";
import { VideoPlayerProps } from "./VideoPlayer.types";

export const VideoPlayerWithControls = (props: VideoPlayerProps) => {
  return (
    <div className="w-full bg-black backdrop-blur-sm border border-white/10 rounded-lg p-2">
      <div>
        <VideoPlayer {...props} />
      </div>
      <PlaybackControls />
    </div>
  );
};
