export const downloadVideo = async (url: string) => {
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `video-${Date.now()}.mp4`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to download video: ${errorMessage}`);
  }
};
