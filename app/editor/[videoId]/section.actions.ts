"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { getAuthenticatedClient } from "@/lib/auth.utils";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { CreateSectionInput, SectionWithClips, UpdateSectionInput } from "./page.types";

export const createSectionAction = async (
  input: CreateSectionInput
): Promise<ActionResponse<SectionWithClips>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const video = await db.video.findUnique({
      where: { id: input.videoId },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    if (video.duration && input.endTime > video.duration) {
      throw new Error("End time exceeds video duration");
    }

    if (input.startTime >= input.endTime) {
      throw new Error("Start time must be before end time");
    }

    if (input.startTime < 0) {
      throw new Error("Start time cannot be negative");
    }

    const section = await db.section.create({
      data: {
        userId: session.user.id,
        videoId: input.videoId,
        startTime: input.startTime,
        endTime: input.endTime,
        order: input.order,
      },
      include: {
        clips: true,
      },
    });

    conditionalLog({ section }, { label: LOG_LABELS.DB });

    return getActionResponse({ data: section as SectionWithClips });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const updateSectionAction = async (
  input: UpdateSectionInput
): Promise<ActionResponse<SectionWithClips>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const existingSection = await db.section.findUnique({
      where: { id: input.sectionId },
      include: { video: true },
    });

    if (!existingSection) {
      throw new Error("Section not found");
    }

    if (existingSection.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    const startTime = input.startTime ?? existingSection.startTime;
    const endTime = input.endTime ?? existingSection.endTime;

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    if (existingSection.video.duration && endTime > existingSection.video.duration) {
      throw new Error("End time exceeds video duration");
    }

    const section = await db.section.update({
      where: { id: input.sectionId },
      data: {
        startTime: input.startTime,
        endTime: input.endTime,
        order: input.order,
      },
      include: {
        clips: true,
      },
    });

    conditionalLog({ section }, { label: LOG_LABELS.DB });

    return getActionResponse({ data: section as SectionWithClips });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const deleteSectionAction = async (
  sectionId: string
): Promise<ActionResponse<void>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const section = await db.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    if (section.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await db.section.delete({
      where: { id: sectionId },
    });

    conditionalLog({ deletedSectionId: sectionId }, { label: LOG_LABELS.DB });

    return getActionResponse();
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};

export const getSectionsAction = async (
  videoId: string
): Promise<ActionResponse<SectionWithClips[]>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const sections = await db.section.findMany({
      where: {
        videoId,
        userId: session.user.id,
      },
      include: {
        clips: {
          orderBy: {
            zIndex: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    conditionalLog({ sectionsCount: sections.length }, { label: LOG_LABELS.DB });

    return getActionResponse({ data: sections as SectionWithClips[] });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.DB });
    return getActionResponse({ error });
  }
};
