import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // cacheTime: 0,
      // gcTime: 0,
      // staleTime: 0,
      structuralSharing: false, // Mikoto.js returns Mikoto* class objects
    },
  },
});
