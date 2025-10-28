import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { ValidationError } from './ClipCreator.types';
import { convertToVideoCoordinates } from './VideoPlayer.utils';

export const useClipCreator = () => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const { currentTime, duration, cropFrame, videoBounds, addClip, clips, videoWidth, videoHeight } = useEditorStore();

  const setStartToCurrentTime = useCallback(() => {
    setStartTime(currentTime);
  }, [currentTime]);

  const setEndToCurrentTime = useCallback(() => {
    setEndTime(currentTime);
  }, [currentTime]);

  const validateClip = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (startTime !== null && startTime < 0) {
      errors.push({ field: 'start', message: 'Start time must be positive' });
    }

    if (endTime !== null && endTime > duration) {
      errors.push({ field: 'end', message: 'End time exceeds video duration' });
    }

    if (startTime !== null && endTime !== null) {
      if (startTime >= endTime) {
        errors.push({ field: 'end', message: 'End time must be after start time' });
      }

      const clipDuration = endTime - startTime;
      if (clipDuration > 180) {
        errors.push({ field: 'duration', message: 'Duration must be 3 minutes or less' });
      }

      const existingClipsDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
      if (existingClipsDuration + clipDuration > 180) {
        errors.push({ field: 'duration', message: 'Total clips duration would exceed 3 minutes' });
      }
    }

    return errors;
  }, [startTime, endTime, duration, clips]);

  useEffect(() => {
    setValidationErrors(validateClip());
  }, [validateClip]);

  const handleAddClip = useCallback(() => {
    if (validationErrors.length > 0 || startTime === null || endTime === null || !videoBounds) {
      return;
    }

    const videoCoords = convertToVideoCoordinates(
      cropFrame.x,
      cropFrame.y,
      cropFrame.width,
      cropFrame.height,
      videoBounds,
      videoWidth,
      videoHeight
    );

    addClip({
      startTime,
      endTime,
      duration: endTime - startTime,
      cropX: videoCoords.x,
      cropY: videoCoords.y,
      cropWidth: videoCoords.width,
      cropHeight: videoCoords.height,
    });

    setStartTime(null);
    setEndTime(null);
  }, [validationErrors, startTime, endTime, cropFrame, videoBounds, addClip]);

  const resetClip = useCallback(() => {
    setStartTime(null);
    setEndTime(null);
  }, []);

  const clipDuration = startTime !== null && endTime !== null ? endTime - startTime : 0;

  const getFieldErrors = useCallback((field: 'start' | 'end' | 'duration') => {
    return validationErrors.filter(error => error.field === field);
  }, [validationErrors]);

  return {
    startTime,
    endTime,
    clipDuration,
    validationErrors,
    getFieldErrors,
    cropFrame,
    setStartTime,
    setEndTime,
    setStartToCurrentTime,
    setEndToCurrentTime,
    handleAddClip,
    resetClip,
  };
};
