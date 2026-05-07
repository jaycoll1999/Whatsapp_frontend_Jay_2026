import { useState, useCallback, useRef, useEffect } from 'react';

interface UseLoginSubmitOptions<T, R> {
  onSubmit: (data: T, abortSignal: AbortSignal) => Promise<R>;
  onSuccess: (result: R) => void;
  onError: (error: any) => void;
}

/**
 * Custom hook to handle login submissions with loading state and AbortController.
 * This fixes the "slow login" issue caused by multiple concurrent requests.
 */
export function useLoginSubmit<T, R>({ onSubmit, onSuccess, onError }: UseLoginSubmitOptions<T, R>) {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = useCallback(async (formData: T) => {
    // 1. Cancel previous pending request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    try {
      const result = await onSubmit(formData, controller.signal);
      
      // If we got here, the request was successful and NOT aborted
      onSuccess(result);
    } catch (error: any) {
      // Don't trigger error state if the request was intentionally aborted
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Login request was cancelled.');
        return;
      }
      
      onError(error);
    } finally {
      // Only reset loading if this is still the active request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [onSubmit, onSuccess, onError]);

  return {
    isLoading,
    handleSubmit,
    cancel: () => abortControllerRef.current?.abort()
  };
}
