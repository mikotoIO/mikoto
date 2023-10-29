import { Notification } from '@mantine/core';
import { AppError } from 'mikotojs';
import { useState } from 'react';

export function useErrorElement() {
  const [error, setError] = useState<AppError | null>(null);
  return {
    el: error && (
      <Notification color="red" onClose={() => setError(null)}>
        {error.message}
      </Notification>
    ),
    error,
    setError,
  };
}
