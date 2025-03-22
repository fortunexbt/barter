import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { BarterOffer } from "@shared/schema";
import { Link } from "wouter";

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
            <div className="bg-secondary bg-opacity-10 p-2 rounded-full">
              <span className="material-icons text-secondary">swap_horiz</span>
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
            className="border-neutral-300 text-neutral-600 text-xs font-medium rounded hover:bg-neutral-100"
          >
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
            <a className="text-primary text-sm font-medium flex items-center">
              View All <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </a>
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
            className="w-full px-4 py-2 bg-secondary text-white text-sm font-medium rounded flex items-center justify-center hover:bg-secondary-dark"
          >
            <span className="material-icons mr-2">add</span>
            Create New Barter Offer
          </Button>
        </Link>
      </div>
    </div>
  );
}
