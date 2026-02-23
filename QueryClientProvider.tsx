'use client'

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryClientProviderProps {
  children: ReactNode;
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  return (
    <TanStackQueryClientProvider client={queryClient}>{children}</TanStackQueryClientProvider>
  );
}
