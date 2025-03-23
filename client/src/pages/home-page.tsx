import { useState } from "react";
import AppShell from "@/components/layout/app-shell";
import StatsOverview from "@/components/dashboard/stats-overview";
import MarketplaceWidget from "@/components/dashboard/marketplace-widget";
import BarterWidget from "@/components/dashboard/barter-widget";
import ProfileSummary from "@/components/dashboard/profile-summary";
import NotificationsWidget from "@/components/dashboard/notifications-widget";
import QuickActions from "@/components/dashboard/quick-actions";
import ContractModal from "@/components/modals/contract-modal";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const openContractModal = (contractId: number) => {
    setSelectedContractId(contractId);
    setContractModalOpen(true);
  };

  return (
    <AppShell>
      {/* Page Content */}
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-6" data-tour="dashboard-overview">
          <h2 className="text-2xl font-semibold text-neutral-600">
            Welcome back, {user?.fullName.split(' ')[0] || 'Trader'}!
          </h2>
          <p className="text-neutral-500">Here's what's happening with your trading activities today.</p>
        </div>
        
        {/* Stats Overview */}
        <StatsOverview />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trades Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commodity Listings */}
            <div data-tour="marketplace-preview">
              <MarketplaceWidget />
            </div>
            
            {/* Barter Opportunities */}
            <div data-tour="barter-preview">
              <BarterWidget />
            </div>
          </div>
          
          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Account & KYC Summary */}
            <ProfileSummary />
            
            {/* Notifications */}
            <NotificationsWidget />
            
            {/* Quick Actions */}
            <QuickActions />
          </div>
        </div>
      </div>
      
      {/* Contract Modal */}
      <ContractModal 
        contractId={selectedContractId} 
        isOpen={contractModalOpen} 
        onOpenChange={setContractModalOpen} 
      />
    </AppShell>
  );
}
