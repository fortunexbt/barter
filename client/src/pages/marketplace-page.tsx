import React, { useState, useEffect, useCallback, ReactNode, memo, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  Bell,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Clock,
  Tag,
  Eye,
  RefreshCw,
  PieChart,
  Truck
} from "lucide-react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

// Memoized Commodity Card component to prevent unnecessary re-renders
interface CommodityCardProps {
  commodity: Commodity;
  isNew: boolean;
  index: number;
  getStatusColor: (status: string) => string;
  getCommodityIcon: (iconName: string | null) => ReactNode;
}

const CommodityCard = memo(({
  commodity,
  isNew,
  index,
  getStatusColor,
  getCommodityIcon
}: CommodityCardProps) => {
  // Determine icon background and text colors
  const bgColorClass = `bg-${commodity.iconBg || "neutral"}-100`;
  const textColorClass = `text-${commodity.iconBg || "neutral"}-600`;
  
  // Generate price trend data (mock)
  const mockTrend = () => {
    const baseValue = commodity.price;
    const trendType = Math.random() > 0.5 ? 'up' : 'down';
    const priceTrend = trendType === 'up' ? 1 + (Math.random() * 0.03) : 1 - (Math.random() * 0.02);
    const formattedPrice = (baseValue * priceTrend).toFixed(2);
    return {
      price: parseFloat(formattedPrice),
      trend: trendType,
      percent: (Math.abs(priceTrend - 1) * 100).toFixed(1)
    };
  };
  
  // Calculate a simulated price trend
  const trend = mockTrend();
  
  return (
    <Link href={`/marketplace/${commodity.id}`}>
      <motion.div
        layout
        initial={isNew ? { scale: 0.9, opacity: 0 } : false}
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
        whileHover={{ 
          y: -5,
          transition: { duration: 0.2 }
        }}
      >
        <Card 
          className={`cursor-pointer hover:shadow-md transition-all overflow-hidden ${isNew ? 'border-primary' : ''}`}
          data-tour={index === 0 ? "marketplace-commodity" : undefined}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`flex-shrink-0 w-9 h-9 ${bgColorClass} rounded-full flex items-center justify-center ${textColorClass}`}>
                  {getCommodityIcon(commodity.icon)}
                </div>
                <div>
                  <h3 className="text-md font-medium text-neutral-800 flex items-center">
                    {commodity.name}
                    {isNew && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white animate-pulse">
                        New
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-500">{commodity.grade}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(commodity.status || "unknown")}>
                {commodity.status 
                  ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1) 
                  : "Unknown"
                }
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Tag size={12} />Price
                  </span>
                  <span className={`text-xs flex items-center gap-0.5 ${trend.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {trend.percent}%
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  ${trend.price.toLocaleString()}
                  <span className="text-xs font-normal ml-1 text-gray-500">/{commodity.priceUnit}</span>
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Package size={12} />Volume
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-primary underline cursor-help">Details</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{commodity.volume} {commodity.volumeUnit} available</p>
                        <p className="text-xs">Grade: {commodity.grade}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold">
                  {formatNumber(commodity.volume)}
                  <span className="text-xs font-normal ml-1 text-gray-500">{commodity.volumeUnit}</span>
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={14} /> {formatDate(commodity.createdAt)} 
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                <Eye size={14} /> View details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
});

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

// Notification component for new commodity listings - memoized to prevent unnecessary re-renders
// Made more subtle and less intrusive
const NewListingNotification = React.memo(({ commodity, onClose }: { commodity: string, onClose: () => void }) => {
  // Parse the commodity string to extract the actual notification text if there's a timestamp ID
  const displayText = commodity.includes('_') ? commodity.split('_')[0] : commodity;
  
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 0.9 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed bottom-4 right-4 bg-white/90 shadow-sm rounded-lg p-3 z-50 border-l-2 border-primary"
      style={{ maxWidth: "300px" }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <Bell className="h-4 w-4 text-primary/70" />
        </div>
        <div className="ml-2 flex-1">
          <p className="text-xs font-medium text-gray-800">New Listing</p>
          <p className="mt-0.5 text-xs text-gray-500">{displayText}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 inline-flex text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
});

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

  // Generate a random listing notification
  const generateRandomListing = useCallback(() => {
    const commodityName = commodityNames[Math.floor(Math.random() * commodityNames.length)];
    const sellerName = sellerNames[Math.floor(Math.random() * sellerNames.length)];
    const grade = ["Grade A", "Premium", "Standard", "Industrial"][Math.floor(Math.random() * 4)];
    
    return `New ${grade} ${commodityName} from ${sellerName}`;
  }, []);
  
  // Function to update highlighted commodities
  const highlightRandomCommodity = useCallback(() => {
    if (commodities && commodities.length > 0) {
      // Get a random existing commodity to highlight
      const randomId = commodities[Math.floor(Math.random() * commodities.length)].id;
      setNewCommodities(prev => [...prev, randomId]);
      
      // Remove the highlight after 5 seconds
      setTimeout(() => {
        setNewCommodities(prev => prev.filter(id => id !== randomId));
      }, 5000);
    }
  }, [commodities]);
  
  // Function to create a random commodity in the database
  const createRandomCommodityMutation = useMutation({
    mutationFn: async () => {
      // Generate random commodity data
      const commodityName = commodityNames[Math.floor(Math.random() * commodityNames.length)];
      const grade = ["Grade A", "Premium", "Standard", "Industrial"][Math.floor(Math.random() * 4)];
      const priceUnits = ["kg", "ton", "barrel", "oz"];
      const volumeUnits = ["kg", "ton", "barrel", "oz", "unit"];
      const icons = ["fuel", "wheat", "gems", "droplet", "package", "equipment"];
      const iconBgs = ["blue", "green", "amber", "red", "slate", "neutral"];
      
      // Using field names that exactly match the schema in server/schema.ts
      // We must include all required fields: name, grade, price, priceUnit, volume, volumeUnit
      const randomCommodity = {
        name: `${grade} ${commodityName}`,
        grade: grade,
        price: Math.floor(Math.random() * 1000) + 10,
        priceUnit: priceUnits[Math.floor(Math.random() * priceUnits.length)],
        volume: Math.floor(Math.random() * 100) + 1,
        volumeUnit: volumeUnits[Math.floor(Math.random() * volumeUnits.length)],
        // Optional fields below
        status: "available",
        icon: icons[Math.floor(Math.random() * icons.length)],
        iconBg: iconBgs[Math.floor(Math.random() * iconBgs.length)]
        // ownerId will be added by the server
      };
      
      const response = await fetch("/api/commodities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(randomCommodity),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create commodity:", errorData);
        
        // Show more detailed error for debugging
        toast({
          title: "Failed to create listing",
          description: errorData.message || "Unknown error",
          variant: "destructive"
        });
        
        throw new Error(`Failed to create new commodity: ${errorData.message}`);
      }
      
      return await response.json();
    },
    onSuccess: (newCommodity) => {
      // Invalidate and refetch commodities query to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/commodities"] });
      
      // Also add to new commodities list to show the highlighting
      setNewCommodities(prev => [...prev, newCommodity.id]);
      
      // Remove highlighting after 5 seconds
      setTimeout(() => {
        setNewCommodities(prev => prev.filter(id => id !== newCommodity.id));
      }, 5000);
      
      const sellerName = sellerNames[Math.floor(Math.random() * sellerNames.length)];
      const notification = `New ${newCommodity.grade} ${newCommodity.name.replace(newCommodity.grade, '')} from ${sellerName}`;
      const timestamp = Date.now(); // Add timestamp to make notifications unique
      const notificationWithId = `${notification}_${timestamp}`;
      
      // Add to notifications with uniqueness check
      setNotifications(prev => {
        // Check if this exact notification already exists
        if (prev.some(n => n.startsWith(notification))) {
          return prev; // Don't add duplicate
        }
        return [notificationWithId, ...prev].slice(0, 3);
      });
      
      // Show less intrusive toast (only during active use)
      if (document.hasFocus()) {
        toast({
          title: "New Listing Added",
          description: notification,
          duration: 3000, // shorter duration
          // Use a default variant but with reduced opacity
          className: "bg-opacity-80"
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create commodity:", error);
      // Fall back to just showing a notification without creating a real commodity
      const notification = generateRandomListing();
      const timestamp = Date.now();
      const notificationWithId = `${notification}_${timestamp}`;
      
      // Add to notifications with uniqueness check
      setNotifications(prev => {
        // Check if this exact notification already exists
        if (prev.some(n => n.startsWith(notification))) {
          return prev; // Don't add duplicate
        }
        return [notificationWithId, ...prev].slice(0, 3);
      });
      
      toast({
        title: "New Listing Alert (Simulated)",
        description: notification,
        duration: 5000
      });
      
      // Still highlight a random commodity
      highlightRandomCommodity();
    }
  });
  
  // Display a toast notification with new listing
  const showNewListingNotification = useCallback(() => {
    // Always create a real commodity (for demo purposes) 
    // In a production environment, we would add proper checks
    createRandomCommodityMutation.mutate();
  }, [createRandomCommodityMutation]);
  
  // Simulate periodic new listings (less frequently to make it less intrusive)
  useEffect(() => {
    // Don't run if commodities haven't loaded yet
    if (!commodities || isLoading) return;
    
    // Store all timeouts to properly clean up
    const timeouts: NodeJS.Timeout[] = [];
    
    // Show one after a reasonable delay on first load (less intrusive)
    const initialTimeout = setTimeout(() => {
      // Only proceed if component is still mounted
      if (commodities && commodities.length > 0) {
        showNewListingNotification();
      }
    }, 8000); // Longer delay before first notification
    
    timeouts.push(initialTimeout);
    
    // Set up the interval for new listings with much longer intervals
    const interval = setInterval(() => {
      showNewListingNotification();
    }, Math.random() * 20000 + 60000); // Random interval between 60-80 seconds (much less frequent)
    
    // Clean up all timeouts and intervals to prevent memory leaks
    return () => {
      clearInterval(interval);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [commodities, isLoading, showNewListingNotification]);
  
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
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link href="/marketplace/manage">
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Manage Listings
              </Button>
            </Link>
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
            {filteredCommodities.map((commodity, index) => (
              <CommodityCard
                key={commodity.id}
                commodity={commodity}
                isNew={newCommodities.includes(commodity.id)}
                index={index}
                getStatusColor={getStatusColor}
                getCommodityIcon={getCommodityIcon}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
