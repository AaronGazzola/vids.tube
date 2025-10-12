export interface VideoInputProps {
  className?: string;
  disabled?: boolean;
}

export interface VideoInputState {
  url: string;
  error: string | null;
  isLoading: boolean;
}
