import React, { useState } from 'react';
import { Notification } from '@mantine/core';
import { AppError } from '../models';

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
