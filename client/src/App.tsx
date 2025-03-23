import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MarketplacePage from "@/pages/marketplace-page";
import CommodityDetailPage from "@/pages/commodity-detail-page";
import BarterPage from "@/pages/barter-page";
import TransactionsPage from "@/pages/transactions-page";
import ContractsPage from "@/pages/contracts-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import DealsPage from "@/pages/deals-page";
import NotificationsPage from "@/pages/notifications-page";
import AdminPage from "@/pages/admin-page";
import { WelcomeModal } from "@/components/modals/welcome-modal";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import ErrorBoundary from "@/components/ui/error-boundary";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/marketplace" component={MarketplacePage} />
      <ProtectedRoute path="/marketplace/new" component={MarketplacePage} />
      <ProtectedRoute path="/marketplace/:id" component={CommodityDetailPage} />
      <ProtectedRoute path="/barter" component={BarterPage} />
      <ProtectedRoute path="/barter/new" component={BarterPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/contracts" component={ContractsPage} />
      <ProtectedRoute path="/deals" component={DealsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/funds" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
      <WelcomeModal />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
