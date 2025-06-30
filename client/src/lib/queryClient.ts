import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  const { body, ...restOptions } = options;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...restOptions.headers,
    },
    ...restOptions,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}