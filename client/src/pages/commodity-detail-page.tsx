import { useParams } from "wouter";
import AppShell from "@/components/layout/app-shell";
import CommodityDetail from "@/components/marketplace/commodity-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CommodityDetailPage() {
  const params = useParams<{ id: string }>();
  const commodityId = parseInt(params.id);
  
  if (isNaN(commodityId)) {
    return (
      <AppShell>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-red-500">
            <h2 className="text-2xl font-semibold">Invalid Commodity ID</h2>
            <p className="mt-2">The commodity ID provided is not valid.</p>
            <Link href="/marketplace">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="ghost" className="mb-4 -ml-2 text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
          <h2 className="text-2xl font-semibold text-neutral-600">Commodity Details</h2>
        </div>
        
        <CommodityDetail commodityId={commodityId} />
      </div>
    </AppShell>
  );
}