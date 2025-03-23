import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      // Try to parse as JSON first
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // If not JSON, get as text
      try {
        errorMessage = await res.text();
      } catch (e2) {
        errorMessage = res.statusText;
      }
    }
    
    console.error(`API Error: ${res.status} - ${errorMessage}`);
    throw new Error(errorMessage || `Error ${res.status}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`API ${method} request to ${url}`);
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (res.status === 401) {
      console.error(`Unauthorized ${method} request to ${url}`);
      throw new Error("Not authenticated");
    }

    if (!res.ok) {
      console.error(`API ${method} request failed with status ${res.status}`);
      
      // Extract detailed error message
      let errorMessage;
      const contentType = res.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        try {
          // Clone the response to avoid consuming it
          const clonedRes = res.clone();
          const errorData = await clonedRes.json();
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          console.error("Error parsing JSON error response:", e);
        }
      }
      
      if (!errorMessage) {
        try {
          // Try to get as text if JSON parsing failed
          const clonedRes = res.clone();
          errorMessage = await clonedRes.text();
        } catch (e) {
          console.error("Error getting error text:", e);
          errorMessage = res.statusText || `Error ${res.status}`;
        }
      }
      
      throw new Error(errorMessage || `Request failed with status ${res.status}`);
    }
    
    return res;
  } catch (error) {
    console.error(`API ${method} request to ${url} failed:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Create an AbortController with timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    try {
      const url = queryKey[0] as string;
      console.log(`API GET request to ${url}`);
      
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache', // Ensure fresh data
          'Pragma': 'no-cache'
        }
      });
      
      // Clear the timeout as request completed
      clearTimeout(timeoutId);

      if (res.status === 401) {
        console.log(`Unauthorized request to ${url}`);
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("Not authenticated");
      }

      if (!res.ok) {
        let errorMessage;
        try {
          // Try to parse as JSON first
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          // If not JSON, get as text
          try {
            errorMessage = await res.text();
          } catch (e2) {
            errorMessage = res.statusText;
          }
        }
        
        console.error(`API Error: ${res.status} - ${errorMessage} for ${url}`);
        throw new Error(errorMessage || `Error ${res.status}`);
      }
      
      // Parse JSON safely
      try {
        return await res.json();
      } catch (error) {
        console.error(`Failed to parse JSON response from ${url}:`, error);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      // Enhance error message with timestamp and more details
      const timestamp = new Date().toISOString();
      let errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = `Request timed out after 15 seconds`;
      }
      
      const enhancedError = new Error(`[${timestamp}] ${errorMessage}`);
      
      // Log error with query details for debugging
      console.error(`Query failed for ${queryKey[0]}:`, enhancedError);
      throw enhancedError;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: import.meta.env.PROD ? true : false, // Only in production to prevent development interruptions
      staleTime: 60 * 1000, // 1 minute to optimize performance
      gcTime: 5 * 60 * 1000, // 5 minutes - replaces cacheTime in React Query v5
      retry: (failureCount, error) => {
        // Don't retry authentication errors
        if (error instanceof Error && (
          error.message.includes('Not authenticated') || 
          error.message.includes('Unauthorized') || 
          error.message.includes('Authentication failed')
        )) {
          return false;
        }
        
        // Don't retry server errors (500+) too many times
        if (error instanceof Error && 
            error.message.includes('server error') && 
            failureCount >= 1) {
          return false;
        }
        
        // Don't retry bad requests (400 range) at all
        if (error instanceof Error && 
            (error.message.includes('Bad Request') || 
             error.message.includes('Not Found'))) {
          return false;
        }
        
        // For other errors, retry up to twice with exponential backoff
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff with max 10s
    },
    mutations: {
      retry: false, // Mutations usually need explicit user action to retry
    },
  },
});
