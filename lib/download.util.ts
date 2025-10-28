export const downloadVideo = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch video");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error("Failed to download video");
  }
};
