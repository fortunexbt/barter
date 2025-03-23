import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import AppShell from "@/components/layout/app-shell";
import { Commodity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Filter, 
  Plus, 
  Search, 
  Package, 
  Leaf, 
  Droplets, 
  Wheat, 
  Banana,
  Gem,
  Fuel,
  Tractor
} from "lucide-react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

const getCommodityIcon = (iconName: string | null): ReactNode => {
  if (!iconName) return <Package size={20} />;
  
  switch (iconName.toLowerCase()) {
    case "agriculture":
    case "wheat":
      return <Wheat size={20} />;
    case "water":
    case "droplet":
      return <Droplets size={20} />;
    case "energy":
    case "fuel":
      return <Fuel size={20} />;
    case "fruits":
    case "food":
      return <Banana size={20} />;
    case "minerals":
    case "gems":
      return <Gem size={20} />;
    case "equipment":
      return <Tractor size={20} />;
    case "eco":
    case "organic":
      return <Leaf size={20} />;
    default:
      return <Package size={20} />;
  }
};

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: commodities, isLoading, error } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities"],
    queryFn: async () => {
      const response = await fetch("/api/commodities");
      if (!response.ok) {
        throw new Error("Failed to fetch commodities");
      }
      return response.json();
    }
  });
  
  const getFilteredCommodities = () => {
    if (!commodities) return [];
    
    return commodities.filter(commodity => {
      const matchesSearch = 
        commodity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commodity.grade.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        (commodity.status && commodity.status === statusFilter);
      
      return matchesSearch && matchesStatus;
    });
  };
  
  const filteredCommodities = getFilteredCommodities();
  
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
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8" data-tour="marketplace">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Marketplace</h2>
            <p className="text-neutral-500">Browse and trade commodities</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/marketplace/new">
              <Button className="bg-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search commodities..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="available">Available</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bidding">Bidding</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sold">Sold</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load commodities
          </div>
        ) : filteredCommodities.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No commodities found matching your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommodities.map((commodity, index) => (
              <Link key={commodity.id} href={`/marketplace/${commodity.id}`}>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  data-tour={index === 0 ? "marketplace-commodity" : undefined}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-10 h-10 bg-${commodity.iconBg || "neutral"}-100 rounded-full flex items-center justify-center text-${commodity.iconBg || "neutral"}-600`}>
                        {getCommodityIcon(commodity.icon)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-neutral-800">{commodity.name}</h3>
                          <Badge variant="outline" className={getStatusColor(commodity.status || "unknown")}>
                            {commodity.status 
                              ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1) 
                              : "Unknown"
                            }
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500">{commodity.grade}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-neutral-500">Price</p>
                            <p className="text-lg font-semibold text-neutral-700">
                              ${commodity.price.toLocaleString()}/{commodity.priceUnit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neutral-500">Volume</p>
                            <p className="text-base font-medium text-neutral-700">
                              {commodity.volume} {commodity.volumeUnit}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
