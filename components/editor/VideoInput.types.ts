export interface VideoInputProps {
  className?: string;
}

export interface VideoInputState {
  url: string;
  error: string | null;
  isLoading: boolean;
}
