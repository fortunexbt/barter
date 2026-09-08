import { lazy, Suspense } from "react";
import { Router, Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import ErrorBoundary from "@/components/ui/error-boundary";
import ProtocolLabPage from "@/pages/protocol-lab-page";

const LegacyApp = lazy(() => import("./legacy-app"));

function LegacyLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-6 text-center">
      <div role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Legacy prototype
        </p>
        <p className="mt-2 text-sm text-neutral-600">Opening the authenticated workspace…</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router base={import.meta.env.BASE_URL}>
          <Switch>
            <Route path="/lab" component={ProtocolLabPage} />
            <Route path="/demo" component={ProtocolLabPage} />
            <Route>
              <Suspense fallback={<LegacyLoading />}>
                <LegacyApp />
              </Suspense>
            </Route>
          </Switch>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
