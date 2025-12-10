import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const CACHE_TIMES = {
  STATIC_DATA: 6 * 60 * 60 * 1000,
  SEMI_STATIC: 30 * 60 * 1000,
  DYNAMIC_DATA: 5 * 60 * 1000,
  USER_DATA: 2 * 60 * 1000,
  REAL_TIME: 30 * 1000,
} as const;

export const staticDataQueryOptions = {
  staleTime: CACHE_TIMES.STATIC_DATA,
  gcTime: CACHE_TIMES.STATIC_DATA * 2,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

export const semiStaticQueryOptions = {
  staleTime: CACHE_TIMES.SEMI_STATIC,
  gcTime: CACHE_TIMES.SEMI_STATIC * 2,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
};

export const userDataQueryOptions = {
  staleTime: CACHE_TIMES.USER_DATA,
  gcTime: CACHE_TIMES.DYNAMIC_DATA,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
};

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
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'online',
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
      networkMode: 'online',
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
