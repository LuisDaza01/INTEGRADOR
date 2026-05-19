// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          2 * 60 * 1000,  // 2 min — don't refetch within this window
      gcTime:             5 * 60 * 1000,  // 5 min — keep unused cache in memory
      retry:              2,
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 0,
    },
  },
})
