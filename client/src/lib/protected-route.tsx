import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route } from "wouter";
import { memo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ErrorBoundary from "@/components/ui/error-boundary";

export const ProtectedRoute = memo(({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) => {
  const { user, isLoading, error } = useAuth();
  const { toast } = useToast();

  // Show auth error toast if authentication fails
  useEffect(() => {
    if (error && !isLoading) {
      toast({
        title: "Authentication Error",
        description: error.message || "Please try logging in again",
        variant: "destructive",
      });
    }
  }, [error, isLoading, toast]);

  // Loading state
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-neutral-500">Loading your information...</p>
        </div>
      </Route>
    );
  }

  // Authentication error state
  if (error) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <ShieldAlert className="h-12 w-12 text-error mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-sm text-neutral-500 mb-4">{error.message || "Please try logging in again"}</p>
          <Redirect to="/auth" />
        </div>
      </Route>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Authenticated state
  return (
    <Route path={path}>
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>
    </Route>
  );
});
