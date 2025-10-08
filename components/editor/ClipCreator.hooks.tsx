import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { ValidationError } from './ClipCreator.types';

export const useClipCreator = () => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const { currentTime, duration, cropFrame, addClip } = useEditorStore();

  const setStartToCurrentTime = useCallback(() => {
    setStartTime(currentTime);
    setValidationErrors([]);
  }, [currentTime]);

  const setEndToCurrentTime = useCallback(() => {
    setEndTime(currentTime);
    setValidationErrors([]);
  }, [currentTime]);

  const validateClip = useCallback((): boolean => {
    const errors: ValidationError[] = [];

    if (startTime === null) {
      errors.push({ field: 'start', message: 'Start time is required' });
    }

    if (endTime === null) {
      errors.push({ field: 'end', message: 'End time is required' });
    }

    if (startTime !== null && endTime !== null) {
      if (startTime >= endTime) {
        errors.push({ field: 'end', message: 'End time must be after start time' });
      }

      const clipDuration = endTime - startTime;
      if (clipDuration <= 0) {
        errors.push({ field: 'duration', message: 'Duration must be greater than 0' });
      }

      if (startTime < 0 || endTime > duration) {
        errors.push({ field: 'duration', message: 'Clip must be within video duration' });
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [startTime, endTime, duration]);

  const handleAddClip = useCallback(() => {
    if (!validateClip() || startTime === null || endTime === null) {
      return;
    }

    addClip({
      startTime,
      endTime,
      duration: endTime - startTime,
      cropX: cropFrame.x,
      cropY: cropFrame.y,
      cropWidth: cropFrame.width,
      cropHeight: cropFrame.height,
    });

    setStartTime(null);
    setEndTime(null);
    setValidationErrors([]);
  }, [validateClip, startTime, endTime, cropFrame, addClip]);

  const resetClip = useCallback(() => {
    setStartTime(null);
    setEndTime(null);
    setValidationErrors([]);
  }, []);

  const clipDuration = startTime !== null && endTime !== null ? endTime - startTime : 0;

  return {
    startTime,
    endTime,
    clipDuration,
    validationErrors,
    setStartTime,
    setEndTime,
    setStartToCurrentTime,
    setEndToCurrentTime,
    handleAddClip,
    resetClip,
  };
};
