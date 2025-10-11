export interface VideoBounds {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export const calculateVideoBounds = (
  containerWidth: number,
  containerHeight: number
): VideoBounds => {
  const videoAspectRatio = 16 / 9;
  const containerAspectRatio = containerWidth / containerHeight;

  let videoWidth: number;
  let videoHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (containerAspectRatio > videoAspectRatio) {
    videoHeight = containerHeight;
    videoWidth = videoHeight * videoAspectRatio;
    offsetX = (containerWidth - videoWidth) / 2;
    offsetY = 0;
  } else {
    videoWidth = containerWidth;
    videoHeight = videoWidth / videoAspectRatio;
    offsetX = 0;
    offsetY = (containerHeight - videoHeight) / 2;
  }

  return {
    offsetX,
    offsetY,
    width: videoWidth,
    height: videoHeight,
  };
};

export const convertToVideoCoordinates = (
  containerX: number,
  containerY: number,
  containerWidth: number,
  containerHeight: number,
  videoBounds: VideoBounds,
  targetVideoWidth: number = 1920,
  targetVideoHeight: number = 1080
) => {
  const relativeX = containerX - videoBounds.offsetX;
  const relativeY = containerY - videoBounds.offsetY;

  const scaleX = targetVideoWidth / videoBounds.width;
  const scaleY = targetVideoHeight / videoBounds.height;

  return {
    x: Math.round(relativeX * scaleX),
    y: Math.round(relativeY * scaleY),
    width: Math.round(containerWidth * scaleX),
    height: Math.round(containerHeight * scaleY),
  };
};

export const convertFromVideoCoordinates = (
  videoX: number,
  videoY: number,
  videoWidth: number,
  videoHeight: number,
  videoBounds: VideoBounds,
  sourceVideoWidth: number = 1920,
  sourceVideoHeight: number = 1080
) => {
  const scaleX = videoBounds.width / sourceVideoWidth;
  const scaleY = videoBounds.height / sourceVideoHeight;

  const containerX = videoX * scaleX + videoBounds.offsetX;
  const containerY = videoY * scaleY + videoBounds.offsetY;

  return {
    x: Math.round(containerX),
    y: Math.round(containerY),
    width: Math.round(videoWidth * scaleX),
    height: Math.round(videoHeight * scaleY),
  };
};
