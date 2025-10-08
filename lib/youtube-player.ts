let apiReady = false;
let apiReadyPromise: Promise<void> | null = null;

export const loadYouTubeAPI = (): Promise<void> => {
  if (apiReady) return Promise.resolve();
  if (apiReadyPromise) return apiReadyPromise;

  apiReadyPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.YT && window.YT.Player) {
      apiReady = true;
      resolve();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      resolve();
    };
  });

  return apiReadyPromise;
};

export const isAPIReady = (): boolean => apiReady;
