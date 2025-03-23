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
    try {
      const url = queryKey[0] as string;
      console.log(`API GET request to ${url}`);
      
      const res = await fetch(url, {
        credentials: "include",
      });

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
      // Log error with query details for debugging
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
