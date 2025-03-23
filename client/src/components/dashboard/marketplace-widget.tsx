import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { Commodity } from "@shared/schema";
import { Link } from "wouter";
import { CommodityCard } from "@/components/marketplace/commodity-card";

export default function MarketplaceWidget() {
  const { data: commodities, isLoading, error } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities"],
    queryFn: async () => {
      const response = await fetch("/api/commodities?limit=5");
      if (!response.ok) {
        throw new Error("Failed to fetch commodities");
      }
      return response.json();
    }
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-600">Recent Marketplace</h3>
          <Link href="/marketplace">
            <Button variant="link" className="text-primary text-sm p-0 h-auto font-medium flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      
      <div>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Failed to load marketplace data
          </div>
        ) : !commodities || commodities.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No commodities available at the moment
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {commodities.slice(0, 4).map((commodity) => (
              <div key={commodity.id} className="h-full">
                <CommodityCard 
                  commodity={commodity}
                  compactView={true}
                  showAnimation={false}
                  isNew={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
