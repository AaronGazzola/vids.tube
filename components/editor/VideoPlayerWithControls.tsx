"use client";

import { PlaybackControls } from "./PlaybackControls";

export const VideoPlayerWithControls = ({ disabled }: { disabled?: boolean }) => {
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="w-full bg-black backdrop-blur-sm border border-white/10 rounded-lg p-2">
        <PlaybackControls />
      </div>
    </div>
  );
};
