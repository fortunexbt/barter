import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowRight, 
  RefreshCw, 
  Plus,
  XCircle
} from "lucide-react";
import { BarterOffer } from "@shared/schema";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BarterOpportunityProps {
  offer: BarterOffer;
}

const BarterOpportunity = ({ offer }: BarterOpportunityProps) => {
  const getValueMatchColor = (match: number) => {
    if (match >= 95) return "text-success";
    if (match >= 80) return "text-warning";
    return "text-error";
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <RefreshCw className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="ml-3 text-sm font-medium text-neutral-600">{offer.title}</h4>
          </div>
          <div className="mt-2 flex items-center">
            <div className="flex items-center mr-6">
              <span className="text-xs text-neutral-500">Value match:</span>
              <span className={`ml-1 text-xs font-medium ${getValueMatchColor(offer.valueMatch)}`}>{offer.valueMatch}%</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-neutral-500">Offered by:</span>
              <span className="ml-1 text-xs font-medium text-neutral-600">User #{offer.offeringUserId}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <Link href={`/barter/${offer.id}`}>
            <Button size="sm" className="bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark">
              View Details
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-neutral-300 text-neutral-600 text-xs font-medium rounded hover:bg-neutral-100 flex items-center"
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function BarterWidget() {
  const { data: barterOffers, isLoading, error } = useQuery<BarterOffer[]>({
    queryKey: ["/api/barter"],
    queryFn: async () => {
      const response = await fetch("/api/barter");
      if (!response.ok) {
        throw new Error("Failed to fetch barter offers");
      }
      return response.json();
    }
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-600">Barter Opportunities</h3>
          <Link href="/barter">
            <Button variant="link" className="text-primary text-sm p-0 h-auto font-medium flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Failed to load barter opportunities
          </div>
        ) : !barterOffers || barterOffers.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No barter opportunities available at the moment
          </div>
        ) : (
          <div className="space-y-4">
            {barterOffers.map((offer) => (
              <BarterOpportunity key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 rounded-b-lg">
        <Link href="/barter/new">
          <Button 
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded flex items-center justify-center hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Barter Offer
          </Button>
        </Link>
      </div>
    </div>
  );
}
