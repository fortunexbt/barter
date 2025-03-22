import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Box, Barcode, Package, Truck, Wheat, Droplet, Gem } from "lucide-react";
import { Commodity } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface CommodityRowProps {
  commodity: Commodity;
}

const CommodityRow = ({ commodity }: CommodityRowProps) => {
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-neutral-200 text-neutral-500";
    
    switch (status) {
      case "available":
        return "bg-green-100 text-green-600";
      case "bidding":
        return "bg-sky-100 text-sky-600";
      case "sold":
        return "bg-neutral-200 text-neutral-500";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };

  // Helper function to get the icon based on the commodity type
  const getCommodityIcon = () => {
    const iconType = commodity.icon || '';
    switch (iconType) {
      case 'Box':
      case 'box':
        return <Box className="h-4 w-4" />;
      case 'Barcode':
      case 'barcode':
        return <Barcode className="h-4 w-4" />;
      case 'Package':
      case 'package':
        return <Package className="h-4 w-4" />;
      case 'Truck':
      case 'truck':
        return <Truck className="h-4 w-4" />;
      case 'Wheat':
      case 'wheat':
        return <Wheat className="h-4 w-4" />;
      case 'Droplet':
      case 'droplet':
        return <Droplet className="h-4 w-4" />;
      case 'Gem':
      case 'gem':
        return <Gem className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  // Helper function to get the background color class
  const getBgColorClass = () => {
    const iconBg = commodity.iconBg || 'primary';
    switch (iconBg) {
      case 'primary': return 'bg-primary/10';
      case 'secondary': return 'bg-blue-100';
      case 'success': return 'bg-green-100';
      case 'warning': return 'bg-amber-100';
      case 'error': return 'bg-red-100';
      case 'info': return 'bg-sky-100';
      default: return 'bg-primary/10';
    }
  };

  // Helper function to get the text color class
  const getTextColorClass = () => {
    const iconBg = commodity.iconBg || 'primary';
    switch (iconBg) {
      case 'primary': return 'text-primary';
      case 'secondary': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-sky-600';
      default: return 'text-primary';
    }
  };

  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            getBgColorClass()
          )}>
            <div className={getTextColorClass()}>
              {getCommodityIcon()}
            </div>
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
          {commodity.status 
            ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1)
            : "Unknown"}
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
