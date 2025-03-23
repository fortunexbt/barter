import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Card, 
  CardHeader, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";
import { 
  Package, 
  Tag, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Eye,
  Wheat,
  Droplets,
  Fuel,
  Banana,
  Gem,
  Tractor,
  Leaf
} from "lucide-react";
import { Commodity } from "@shared/schema";
import { formatNumber, formatDate } from "@/lib/utils";

export interface CommodityCardProps {
  commodity: Commodity;
  isNew?: boolean;
  index?: number;
  showAnimation?: boolean;
  compactView?: boolean;
}

export function CommodityCard({
  commodity,
  isNew = false,
  index = 0,
  showAnimation = true,
  compactView = false
}: CommodityCardProps) {
  // Determine icon background and text colors
  const bgColorClass = `bg-${commodity.iconBg || "neutral"}-100`;
  const textColorClass = `text-${commodity.iconBg || "neutral"}-600`;
  
  // Get status style
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
  
  // Get appropriate icon for commodity type
  const getCommodityIcon = (iconName: string | null): ReactNode => {
    if (!iconName) return <Package size={compactView ? 16 : 20} />;
    
    // Icons are already imported at the top, use them directly
    switch (iconName.toLowerCase()) {
      case "agriculture":
      case "wheat":
        return <Wheat size={compactView ? 16 : 20} />;
      case "water":
      case "droplet":
        return <Droplets size={compactView ? 16 : 20} />;
      case "energy":
      case "fuel":
        return <Fuel size={compactView ? 16 : 20} />;
      case "fruits":
      case "food":
        return <Banana size={compactView ? 16 : 20} />;
      case "minerals":
      case "gems":
        return <Gem size={compactView ? 16 : 20} />;
      case "equipment":
        return <Tractor size={compactView ? 16 : 20} />;
      case "eco":
      case "organic":
        return <Leaf size={compactView ? 16 : 20} />;
      default:
        return <Package size={compactView ? 16 : 20} />;
    }
  };
  
  // Get current price trend (demonstration purposes)
  const getPriceTrend = () => {
    const baseValue = commodity.price;
    // Use commodity id as seed for consistent randomness
    const seed = commodity.id % 100;
    const trendType = (seed % 2 === 0) ? 'up' : 'down';
    const variationPercentage = (seed % 5 + 1) / 100; // Between 1% and 5%
    const priceTrend = trendType === 'up' 
      ? 1 + variationPercentage 
      : 1 - variationPercentage;
    const formattedPrice = (baseValue * priceTrend).toFixed(2);
    
    return {
      price: parseFloat(formattedPrice),
      trend: trendType,
      percent: (Math.abs(priceTrend - 1) * 100).toFixed(1)
    };
  };
  
  // Calculate price trend
  const trend = getPriceTrend();
  
  // Compact card for grid views
  if (compactView) {
    return (
      <Link href={`/marketplace/${commodity.id}`}>
        <Card className="cursor-pointer hover:shadow-md transition-all h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex-shrink-0 w-8 h-8 ${bgColorClass} rounded-full flex items-center justify-center ${textColorClass}`}>
                  {getCommodityIcon(commodity.icon)}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{commodity.name}</h3>
                  <p className="text-xs text-neutral-500">{commodity.grade}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(commodity.status || "unknown")}>
                {commodity.status 
                  ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1) 
                  : "Unknown"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-neutral-500">Price</p>
                <p className="text-sm font-semibold">
                  ${commodity.price.toLocaleString()}/{commodity.priceUnit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Volume</p>
                <p className="text-sm font-semibold">
                  {formatNumber(commodity.volume)} {commodity.volumeUnit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
  
  // Full card with animations for primary views
  return (
    <Link href={`/marketplace/${commodity.id}`}>
      {showAnimation ? (
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
      ) : (
        <Card 
          className={`cursor-pointer hover:shadow-md transition-all overflow-hidden ${isNew ? 'border-primary' : ''}`}
          data-tour={index === 0 ? "marketplace-commodity" : undefined}
        >
          {/* Same content as above, but without the motion wrapper */}
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
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
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
      )}
    </Link>
  );
}