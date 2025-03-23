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
      
      <div className="overflow-x-auto">
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
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Commodity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Volume</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {commodities.map((commodity) => (
                <CommodityRow key={commodity.id} commodity={commodity} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
