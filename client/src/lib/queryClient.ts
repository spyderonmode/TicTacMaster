import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON error response to extract the message field
    try {
      const errorData = JSON.parse(text);
      // If there's a message field in the JSON, use only that (without status code prefix)
      const errorMessage = errorData.message || text;
      const error: any = new Error(errorMessage);
      error.status = res.status;
      error.data = errorData;
      throw error;
    } catch (parseError) {
      // If JSON parsing fails, use the text as is (without status code prefix)
      const error: any = new Error(text);
      error.status = res.status;
      throw error;
    }
  }
}

export async function apiRequest(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<Response> {
  const method = options?.method || 'GET';
  const data = options?.body;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Always fetch fresh data on component mount
      staleTime: 0, // Always fetch fresh data, no caching
      gcTime: 30000, // Keep data in cache for 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Handle unhandled promise rejections gracefully
        console.error('Mutation error:', error);
      },
    },
  },
});
