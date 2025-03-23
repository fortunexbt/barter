import { useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Tractor,
  Bell
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
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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

// Sample commodity names and seller names for simulated new listings
const commodityNames = [
  "Crude Oil",
  "Gold",
  "Silver",
  "Natural Gas",
  "Wheat",
  "Soybeans",
  "Coffee",
  "Cotton",
  "Copper",
  "Aluminum",
  "Nickel",
  "Iron Ore",
  "Rice",
  "Corn",
  "Cocoa",
  "Sugar",
  "Platinum",
  "Palladium",
  "Diamond"
];

const sellerNames = [
  "GlobalResources Inc",
  "PrimeMinerals Ltd",
  "AgriTech Farms",
  "MetalAlliance Co",
  "EcoHarvest Group",
  "EnergySolutions",
  "PrecisionMetals",
  "NaturalReserves"
];

// Notification component for new commodity listings
const NewListingNotification = ({ commodity, onClose }: { commodity: string, onClose: () => void }) => {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-20 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border-l-4 border-primary"
      style={{ maxWidth: "350px" }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">New Listing Alert</p>
          <p className="mt-1 text-sm text-gray-500">{commodity}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 inline-flex text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [newCommodities, setNewCommodities] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Simulate periodic new listings
  useEffect(() => {
    // Don't run if commodities haven't loaded yet
    if (!commodities || isLoading) return;
    
    // Function to generate a random listing notification
    const generateRandomListing = () => {
      const commodityName = commodityNames[Math.floor(Math.random() * commodityNames.length)];
      const sellerName = sellerNames[Math.floor(Math.random() * sellerNames.length)];
      const grade = ["Grade A", "Premium", "Standard", "Industrial"][Math.floor(Math.random() * 4)];
      
      return `New ${grade} ${commodityName} from ${sellerName}`;
    };
    
    // Function to update highlighted commodities
    const highlightRandomCommodity = () => {
      if (commodities && commodities.length > 0) {
        // Get a random existing commodity to highlight
        const randomId = commodities[Math.floor(Math.random() * commodities.length)].id;
        setNewCommodities(prev => [...prev, randomId]);
        
        // Remove the highlight after 5 seconds
        setTimeout(() => {
          setNewCommodities(prev => prev.filter(id => id !== randomId));
        }, 5000);
      }
    };
    
    // Display a toast notification with new listing
    const showNewListingNotification = () => {
      const notification = generateRandomListing();
      setNotifications(prev => [notification, ...prev].slice(0, 3));
      
      // Also show a toast
      toast({
        title: "New Listing Alert",
        description: notification,
        duration: 5000
      });
      
      // Highlight a random commodity
      highlightRandomCommodity();
    };
    
    // Set up the interval for new listings (every 20-30 seconds)
    const interval = setInterval(() => {
      showNewListingNotification();
    }, Math.random() * 10000 + 20000); // Random interval between 20-30 seconds
    
    // Show one immediately on first load
    const initialTimeout = setTimeout(() => {
      showNewListingNotification();
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [commodities, isLoading, toast]);
  
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
        
        {/* Display notification popups */}
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <NewListingNotification 
              key={`notification-${index}`}
              commodity={notification}
              onClose={() => {
                setNotifications(notifications.filter((_, i) => i !== index));
              }}
            />
          ))}
        </AnimatePresence>

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
            {filteredCommodities.map((commodity, index) => {
              const isNew = newCommodities.includes(commodity.id);
              
              return (
                <Link key={commodity.id} href={`/marketplace/${commodity.id}`}>
                  <motion.div
                    layout
                    initial={isNew ? { scale: 0.8, opacity: 0 } : false}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      boxShadow: isNew ? "0 0 15px rgba(79, 70, 229, 0.6)" : "none"
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.5
                    }}
                  >
                    <Card 
                      className={`cursor-pointer hover:shadow-md transition-all ${isNew ? 'border-primary' : ''}`}
                      data-tour={index === 0 ? "marketplace-commodity" : undefined}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 w-10 h-10 bg-${commodity.iconBg || "neutral"}-100 rounded-full flex items-center justify-center text-${commodity.iconBg || "neutral"}-600`}>
                            {getCommodityIcon(commodity.icon)}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-neutral-800">
                                {commodity.name}
                                {isNew && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white animate-pulse">
                                    New
                                  </span>
                                )}
                              </h3>
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
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
