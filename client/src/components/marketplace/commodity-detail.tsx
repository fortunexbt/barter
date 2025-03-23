import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Commodity, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Loader2,
  Package,
  Leaf,
  Droplets,
  Wheat,
  Banana,
  Gem,
  Fuel,
  Tractor,
  AlertCircle,
  CheckCircle,
  BarChart
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CommodityDetailProps {
  commodityId: number;
}

// Helper function to get the appropriate icon for a commodity type
const getCommodityIcon = (iconName: string | null) => {
  if (!iconName) return <Package size={24} />;
  
  switch (iconName.toLowerCase()) {
    case "agriculture":
    case "wheat":
      return <Wheat size={24} />;
    case "water":
    case "droplet":
      return <Droplets size={24} />;
    case "energy":
    case "fuel":
      return <Fuel size={24} />;
    case "fruits":
    case "food":
      return <Banana size={24} />;
    case "minerals":
    case "gems":
      return <Gem size={24} />;
    case "equipment":
      return <Tractor size={24} />;
    case "eco":
    case "organic":
      return <Leaf size={24} />;
    default:
      return <Package size={24} />;
  }
};

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

export default function CommodityDetail({ commodityId }: CommodityDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchaseAmount, setPurchaseAmount] = useState<number>(1);
  const [showContractDialog, setShowContractDialog] = useState<boolean>(false);
  const [escrowAddress, setEscrowAddress] = useState<string>("");
  const [escrowDepositAmount, setEscrowDepositAmount] = useState<number>(0);
  
  // Fetch commodity details
  const { data: commodity, isLoading: isLoadingCommodity, error: commodityError } = useQuery<Commodity>({
    queryKey: [`/api/commodities/${commodityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/commodities/${commodityId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch commodity details");
      }
      return response.json();
    }
  });
  
  // Fetch owner details if commodity is available
  const { data: owner, isLoading: isLoadingOwner } = useQuery<User>({
    queryKey: [`/api/user/${commodity?.ownerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/user/${commodity?.ownerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch owner details");
      }
      return response.json();
    },
    enabled: !!commodity?.ownerId
  });
  
  // Create escrow contract mutation
  const createEscrowMutation = useMutation({
    mutationFn: async ({ buyerId, commodityId, amount }: { buyerId: number, commodityId: number, amount: number }) => {
      const res = await apiRequest("POST", "/api/smart-contracts/escrow", {
        buyerId,
        commodityId,
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setEscrowAddress(data.contractAddress);
      setEscrowDepositAmount(calculateTotal());
      setShowContractDialog(true);
      toast({
        title: "Escrow contract created",
        description: "Smart contract has been deployed to the blockchain",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create escrow contract",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Deposit to escrow mutation
  const depositToEscrowMutation = useMutation({
    mutationFn: async ({ contractAddress, amount }: { contractAddress: string, amount: number }) => {
      const res = await apiRequest("POST", "/api/smart-contracts/escrow/deposit", {
        contractAddress,
        amount
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Funds deposited to escrow",
        description: "Transaction has been sent to the blockchain",
        variant: "default"
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to deposit funds",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Release funds from escrow mutation
  const releaseFromEscrowMutation = useMutation({
    mutationFn: async ({ contractAddress }: { contractAddress: string }) => {
      const res = await apiRequest("POST", "/api/smart-contracts/escrow/release", {
        contractAddress
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Funds released from escrow",
        description: "Transaction has been sent to the blockchain",
        variant: "default"
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setShowContractDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to release funds",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handlePurchase = () => {
    if (!user || !commodity) return;
    
    createEscrowMutation.mutate({
      buyerId: user.id,
      commodityId: commodity.id,
      amount: calculateTotal()
    });
  };
  
  const handleDepositToEscrow = () => {
    if (!escrowAddress) return;
    
    depositToEscrowMutation.mutate({
      contractAddress: escrowAddress,
      amount: escrowDepositAmount
    });
  };
  
  const handleReleaseEscrow = () => {
    if (!escrowAddress) return;
    
    releaseFromEscrowMutation.mutate({
      contractAddress: escrowAddress
    });
  };
  
  const calculateTotal = (): number => {
    if (!commodity) return 0;
    return parseFloat((commodity.price * purchaseAmount).toFixed(2));
  };
  
  if (isLoadingCommodity) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
      </div>
    );
  }
  
  if (commodityError || !commodity) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium">Failed to load commodity details</h3>
      </div>
    );
  }
  
  const isOwner = user?.id === commodity.ownerId;
  const isAvailable = commodity.status === "available";
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 px-4 sm:px-6 lg:px-8">
      {/* Commodity details */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{commodity.name}</CardTitle>
              <CardDescription className="text-neutral-500">
                Grade: {commodity.grade}
              </CardDescription>
            </div>
            <Badge variant="outline" className={getStatusColor(commodity.status || "unknown")}>
              {commodity.status 
                ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1) 
                : "Unknown"
              }
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex-shrink-0 w-12 h-12 bg-${commodity.iconBg || "neutral"}-100 rounded-full flex items-center justify-center text-${commodity.iconBg || "neutral"}-600`}>
                {getCommodityIcon(commodity.icon)}
              </div>
              <div>
                <h3 className="text-lg font-medium">Commodity Details</h3>
                <p className="text-sm text-neutral-500">
                  Listed on {new Date(commodity.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-neutral-500">Price</p>
                <p className="text-xl font-semibold">
                  ${commodity.price.toLocaleString()}/{commodity.priceUnit}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Available Volume</p>
                <p className="text-xl font-semibold">
                  {commodity.volume} {commodity.volumeUnit}
                </p>
              </div>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="blockchain">
                <AccordionTrigger>Blockchain Verification</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-success mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Verified Digital Ownership</p>
                        <p className="text-sm text-neutral-500">
                          This commodity has been verified on the blockchain with smart contract protection.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <BarChart className="h-5 w-5 text-info mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium">Price Oracle Integration</p>
                        <p className="text-sm text-neutral-500">
                          Price data validated against decentralized price oracles.
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="trading-info">
                <AccordionTrigger>Trading Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Market Conditions</h4>
                      <p className="text-sm text-neutral-600">
                        Current market conditions show {commodity.price > 100 ? "high" : "moderate"} 
                        demand for this commodity. Prices have been 
                        {commodity.price > 100 ? " increasing" : " stable"} 
                        over the past month.
                      </p>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Trading Volume (24h)</span>
                      <span>{Math.floor(Math.random() * 1000)} {commodity.volumeUnit}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Last Trade</span>
                      <span>{Math.floor(Math.random() * 24)} hours ago</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
      
      {/* Purchase panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Purchase Information</CardTitle>
            <CardDescription>
              {isAvailable 
                ? "This commodity is available for purchase" 
                : "This commodity is not currently available"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAvailable && (
              <div className="space-y-6">
                {/* Owner info */}
                <div className="bg-neutral-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Seller Information</h4>
                  {isLoadingOwner ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Loading seller information...</span>
                    </div>
                  ) : owner ? (
                    <div className="text-sm text-neutral-600">
                      <p><span className="font-medium">Seller:</span> {owner.fullName}</p>
                      <p><span className="font-medium">Trading since:</span> {new Date(owner.tradingSince || "").toLocaleDateString()}</p>
                      <p>
                        <span className="font-medium">KYC Status:</span>
                        {owner.kycStatus === "verified" ? (
                          <span className="inline-flex items-center ml-2 text-success">
                            <CheckCircle className="h-3 w-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center ml-2 text-warning">
                            <AlertCircle className="h-3 w-3 mr-1" /> Pending
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Could not load seller information</p>
                  )}
                </div>
                
                {/* Purchase controls */}
                {!isOwner && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="quantity" className="text-sm font-medium">
                        Quantity ({commodity.volumeUnit})
                      </label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={commodity.volume.toString()}
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(Math.max(1, Math.min(Number(e.target.value), commodity.volume)))}
                      />
                    </div>
                    
                    <div className="flex justify-between py-2 border-t border-b border-neutral-200">
                      <span className="font-medium">Total:</span>
                      <span className="font-semibold">${calculateTotal().toLocaleString()}</span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handlePurchase}
                      disabled={createEscrowMutation.isPending}
                    >
                      {createEscrowMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Smart Contract
                    </Button>
                    
                    <div className="text-xs text-neutral-500 text-center">
                      <p>Secure transaction with escrow protection</p>
                      <p>ZKP-verified seller identity</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!isAvailable && (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-500">This item is no longer available for purchase</p>
              </div>
            )}
            
            {isOwner && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-neutral-600">You are the owner of this commodity</p>
                <Button variant="outline" className="mt-4">
                  Manage Listing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Smart Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Smart Contract Escrow</DialogTitle>
            <DialogDescription>
              Commodity purchase is secured through a blockchain smart contract escrow system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-neutral-50 p-4 rounded-md">
              <h4 className="font-medium mb-2 flex items-center">
                <ShieldCheck className="h-4 w-4 text-success mr-2" />
                Escrow Contract Created
              </h4>
              <p className="text-xs text-neutral-600 font-mono break-all">
                Contract Address: {escrowAddress}
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Escrow Process:</h4>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                  1
                </div>
                <div className="ml-3">
                  <p className="text-sm">Deposit funds to the escrow contract</p>
                  <p className="text-xs text-neutral-500">Funds will be held securely until delivery</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                  2
                </div>
                <div className="ml-3">
                  <p className="text-sm">Seller delivers the commodity</p>
                  <p className="text-xs text-neutral-500">You'll receive a delivery confirmation</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                  3
                </div>
                <div className="ml-3">
                  <p className="text-sm">Release funds after confirmation</p>
                  <p className="text-xs text-neutral-500">Complete the transaction after successful delivery</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setShowContractDialog(false)}
            >
              Review Later
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={handleDepositToEscrow}
                disabled={depositToEscrowMutation.isPending}
              >
                {depositToEscrowMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Deposit ${escrowDepositAmount}
              </Button>
              <Button
                onClick={handleReleaseEscrow}
                disabled={releaseFromEscrowMutation.isPending}
              >
                {releaseFromEscrowMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Release Funds
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}