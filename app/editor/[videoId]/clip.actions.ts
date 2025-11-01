"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { getAuthenticatedClient } from "@/lib/auth.utils";
import { Clip } from "@/lib/generated/prisma";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { CreateClipInput, GenerateThumbnailInput, UpdateClipInput } from "./page.types";

export const createClipAction = async (
  input: CreateClipInput
): Promise<ActionResponse<Clip>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const section = await db.section.findUnique({
      where: { id: input.sectionId },
      include: {
        clips: true,
        video: true,
      },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (section.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    const clipCount = section.clips.length;
    if (clipCount >= 5) {
      throw new Error("Maximum 5 clips per section");
    }

    if (input.cropX < 0 || input.cropY < 0) {
      throw new Error("Crop coordinates cannot be negative");
    }

    if (input.cropWidth <= 0 || input.cropHeight <= 0) {
      throw new Error("Crop dimensions must be positive");
    }

    if (input.previewX < 0 || input.previewY < 0) {
      throw new Error("Preview coordinates cannot be negative");
    }

    if (input.previewScale <= 0) {
      throw new Error("Preview scale must be positive");
    }

    const maxZIndex = section.clips.reduce((max, clip) => Math.max(max, clip.zIndex), -1);
    const zIndex = input.zIndex ?? maxZIndex + 1;

    const clip = await db.clip.create({
      data: {
        userId: session.user.id,
        sectionId: input.sectionId,
        cropX: input.cropX,
        cropY: input.cropY,
        cropWidth: input.cropWidth,
        cropHeight: input.cropHeight,
        previewX: input.previewX,
        previewY: input.previewY,
        previewScale: input.previewScale,
        zIndex,
      },
    });

    conditionalLog({ clip }, { label: LOG_LABELS.DB });

    return getActionResponse({ data: clip });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const updateClipAction = async (
  input: UpdateClipInput
): Promise<ActionResponse<Clip>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const existingClip = await db.clip.findUnique({
      where: { id: input.clipId },
    });

    if (!existingClip) {
      throw new Error("Clip not found");
    }

    if (existingClip.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    if (input.previewX !== undefined && input.previewX < 0) {
      throw new Error("Preview X cannot be negative");
    }

    if (input.previewY !== undefined && input.previewY < 0) {
      throw new Error("Preview Y cannot be negative");
    }

    if (input.previewScale !== undefined && input.previewScale <= 0) {
      throw new Error("Preview scale must be positive");
    }

    const clip = await db.clip.update({
      where: { id: input.clipId },
      data: {
        previewX: input.previewX,
        previewY: input.previewY,
        previewScale: input.previewScale,
        zIndex: input.zIndex,
      },
    });

    conditionalLog({ clip }, { label: LOG_LABELS.DB });

    return getActionResponse({ data: clip });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const deleteClipAction = async (
  clipId: string
): Promise<ActionResponse<void>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const clip = await db.clip.findUnique({
      where: { id: clipId },
    });

    if (!clip) {
      throw new Error("Clip not found");
    }

    if (clip.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await db.clip.delete({
      where: { id: clipId },
    });

    conditionalLog({ deletedClipId: clipId }, { label: LOG_LABELS.DB });

    return getActionResponse();
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const generateClipThumbnailAction = async (
  input: GenerateThumbnailInput
): Promise<ActionResponse<{ thumbnailUrl: string }>> => {
  try {
    const { session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const workerUrl = process.env.WORKER_URL || process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
      throw new Error("Worker URL not configured");
    }

    const response = await fetch(`${workerUrl}/api/worker/thumbnail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate thumbnail");
    }

    const data = await response.json();

    conditionalLog({ thumbnailUrl: data.thumbnailUrl }, { label: LOG_LABELS.API });

    return getActionResponse({ data: { thumbnailUrl: data.thumbnailUrl } });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.API });
    return getActionResponse({ error });
  }
};
