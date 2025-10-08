export interface ClipCreatorProps {
  className?: string;
}

export interface ValidationError {
  field: 'start' | 'end' | 'duration';
  message: string;
}
