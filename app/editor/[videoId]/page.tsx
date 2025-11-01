"use client";

import { parseParam } from "@/lib/string.util";
import { useParams } from "next/navigation";
import { SectionManager } from "./(components)/SectionManager";
import { ClipCreator } from "./(components)/ClipCreator";
import { PreviewWindow } from "./(components)/PreviewWindow";
import { ClipsList } from "./(components)/ClipsList";
import { useGetSections } from "./section.hooks";
import { useShortsEditorStore } from "./page.stores";
import { useProcessingStore } from "./page.stores";
import { useProcessingStatus } from "./processing.hooks";
import { useEffect } from "react";

export default function ShortsEditorPage() {
  const { videoId: videoIdParam } = useParams();
  const videoId = parseParam(videoIdParam);
  const { data: sections, isLoading } = useGetSections(videoId);
  const { currentJob } = useProcessingStore();

  useProcessingStatus(currentJob?.id || null, !!currentJob?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex">
        <div className="w-64 bg-white">
          <SectionManager videoId={videoId} />
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Shorts Video Editor</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Video Player</h2>
              <div className="bg-black aspect-video rounded flex items-center justify-center text-white">
                Video Player Placeholder
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <ClipCreator videoId={videoId} />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <ClipsList />
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l">
          <PreviewWindow />
        </div>
      </div>
    </div>
  );
}
