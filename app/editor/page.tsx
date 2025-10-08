"use client";

import { VideoInput } from "@/components/editor/VideoInput";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { useEditorStore } from "@/store/useEditorStore";
import { PlayerState } from "@/lib/youtube-player.types";
import { YouTubePlayer } from "@/lib/youtube-player.types";

export default function EditorPage() {
  const { videoId, setIsPlaying, setCurrentTime, setDuration } = useEditorStore();

  const handlePlayerReady = (player: YouTubePlayer) => {
    const duration = player.getDuration();
    setDuration(duration);
  };

  const handleStateChange = (state: PlayerState) => {
    setIsPlaying(state === "playing");
  };

  const handleError = (errorCode: number) => {
    console.error(JSON.stringify({ error: "YouTube Player Error", code: errorCode }, null, 0));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">YouTube Clip Editor</h1>
        <div className="space-y-4">
          <VideoInput />
          {videoId && (
            <VideoPlayer
              videoId={videoId}
              onReady={handlePlayerReady}
              onStateChange={handleStateChange}
              onError={handleError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
