import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing: false, // Mikoto.js returns Mikoto* class objects
    }
  }
});
