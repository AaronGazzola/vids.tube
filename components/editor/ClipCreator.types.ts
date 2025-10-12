export interface ClipCreatorProps {
  className?: string;
  disabled?: boolean;
}

export interface ValidationError {
  field: 'start' | 'end' | 'duration';
  message: string;
}
