export interface ActionResponse<T = void> {
  data?: T;
  error?: string;
}

export function getActionResponse<T = void>(params?: {
  data?: T;
  error?: unknown;
}): ActionResponse<T> {
  if (params?.error) {
    const errorMessage =
      params.error instanceof Error
        ? params.error.message
        : typeof params.error === "string"
        ? params.error
        : "An unknown error occurred";

    return { error: errorMessage };
  }

  if (params?.data !== undefined) {
    return { data: params.data };
  }

  return { data: undefined as T };
}
