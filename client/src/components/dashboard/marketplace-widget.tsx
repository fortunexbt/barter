import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Commodity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface CommodityRowProps {
  commodity: Commodity;
}

const CommodityRow = ({ commodity }: CommodityRowProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success bg-opacity-10 text-success";
      case "bidding":
        return "bg-info bg-opacity-10 text-info";
      case "sold":
        return "bg-neutral-200 text-neutral-500";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-8 h-8 bg-${commodity.iconBg} bg-opacity-10 rounded-full flex items-center justify-center`}>
            <span className={`material-icons text-${commodity.iconBg} text-sm`}>{commodity.icon}</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-neutral-600">{commodity.name}</div>
            <div className="text-xs text-neutral-400">{commodity.grade}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-neutral-600">{`$${commodity.price.toLocaleString()}/${commodity.priceUnit}`}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-neutral-600">{`${commodity.volume} ${commodity.volumeUnit}`}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="outline" className={getStatusColor(commodity.status)}>
          {commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1)}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
        <Link href={`/marketplace/${commodity.id}`}>
          <Button variant="link" className="text-primary hover:text-primary-dark">View</Button>
        </Link>
      </td>
    </tr>
  );
};

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
            <a className="text-primary text-sm font-medium flex items-center">
              View All <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </a>
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
