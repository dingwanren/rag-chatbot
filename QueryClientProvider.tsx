'use client'

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryClientProviderProps {
  children: ReactNode;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const queryClient = getQueryClient()

  return (
    <TanStackQueryClientProvider client={queryClient}>{children}</TanStackQueryClientProvider>
  );
}
