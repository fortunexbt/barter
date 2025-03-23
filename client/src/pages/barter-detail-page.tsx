import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import AppShell from "@/components/layout/app-shell";
import { BarterOffer, Commodity, User } from "@shared/schema";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ArrowRight, User as UserIcon, Package, DollarSign, Shield } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import ZkpVerificationModal from "@/components/modals/zkp-verification-modal";
import SmartContractCreationModal from "@/components/modals/smart-contract-creation-modal";
import EscrowDepositModal from "@/components/modals/escrow-deposit-modal";
import EscrowReleaseModal from "@/components/modals/escrow-release-modal";

// Extended type for the enhanced barter offer from the API
interface EnhancedBarterOffer extends BarterOffer {
  offeringCommodity: Commodity | null;
  requestingCommodity: Commodity | null;
  offeringUser: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
    verificationStatus: string;
  } | null;
  requestingUser: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
    verificationStatus: string;
  } | null;
}

export default function BarterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isZkpModalOpen, setIsZkpModalOpen] = useState(false);
  const [isSmartContractModalOpen, setIsSmartContractModalOpen] = useState(false);
  const [isEscrowDepositModalOpen, setIsEscrowDepositModalOpen] = useState(false);
  const [isEscrowReleaseModalOpen, setIsEscrowReleaseModalOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");
  
  // Fetch barter offer details
  const { data: barterOffer, isLoading, error } = useQuery<EnhancedBarterOffer>({
    queryKey: [`/api/barter/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/barter/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Barter offer not found");
        }
        throw new Error("Failed to load barter offer details");
      }
      return response.json();
    }
  });
  
  // Accept barter offer mutation
  const acceptBarterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/barter/${id}`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/barter/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/barter"] });
      toast({
        title: "Barter offer accepted",
        description: "The barter transaction will now be processed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept barter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reject barter offer mutation
  const rejectBarterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/barter/${id}`, { status: "rejected" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/barter/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/barter"] });
      toast({
        title: "Barter offer rejected",
        description: "The barter offer has been declined",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject barter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-warning bg-opacity-10 text-warning";
      case "accepted":
        return "bg-success bg-opacity-10 text-success";
      case "rejected":
        return "bg-error bg-opacity-10 text-error";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };
  
  const getValueMatchColor = (match: number) => {
    if (match >= 95) return "text-success";
    if (match >= 80) return "text-warning";
    return "text-error";
  };
  
  const isReceivingUser = user && barterOffer && user.id === barterOffer.requestingUserId;
  const isOfferingUser = user && barterOffer && user.id === barterOffer.offeringUserId;
  const canAcceptOrReject = isReceivingUser && barterOffer?.status === "pending";

  // Calculate the value difference in percentage
  const getValueDifference = () => {
    if (!barterOffer?.offeringCommodity || !barterOffer?.requestingCommodity) return 0;
    
    const offeringValue = barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume;
    const requestingValue = barterOffer.requestingCommodity.price * barterOffer.requestingCommodity.volume;
    
    return Math.abs(((offeringValue - requestingValue) / requestingValue) * 100).toFixed(1);
  };

  // Smart contract integration functions
  const handleCreateSmartContract = () => {
    // Open smart contract creation modal
    if (!barterOffer?.offeringCommodity || !barterOffer?.requestingCommodity) {
      toast({
        title: "Missing Commodity Data",
        description: "Cannot create smart contract: commodity data is missing",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate the total value for escrow
    const offeringValue = barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume;
    const requestingValue = barterOffer.requestingCommodity.price * barterOffer.requestingCommodity.volume;
    
    // Use the higher value for the escrow amount as a safety measure
    const escrowAmount = Math.max(offeringValue, requestingValue).toString();
    setEscrowAmount(escrowAmount);
    
    // Open the modal with the appropriate buyer/seller data
    setIsSmartContractModalOpen(true);
  };
  
  const handleSmartContractCreated = (data: any) => {
    // Store the contract address for deposit and release operations
    setContractAddress(data.contractAddress);
    queryClient.invalidateQueries({ queryKey: [`/api/barter/${id}`] });
    
    // Open the deposit modal after contract creation
    setIsEscrowDepositModalOpen(true);
  };
  
  const handleEscrowDeposited = () => {
    toast({
      title: "Escrow Deposit Complete",
      description: "Funds have been deposited to the escrow smart contract.",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };
  
  const handleEscrowReleased = () => {
    toast({
      title: "Escrow Released",
      description: "Funds have been released to the seller. Transaction complete.",
    });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        </div>
      </AppShell>
    );
  }

  if (error || !barterOffer) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <h3 className="text-xl font-medium text-red-500 mb-2">Barter offer not found</h3>
          <p className="text-neutral-500 mb-6">The barter offer you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate("/barter")}>Return to Barter Page</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-neutral-600">Barter Offer Details</h2>
              <Badge className={getStatusColor(barterOffer.status)}>
                {barterOffer.status?.charAt(0).toUpperCase() + barterOffer.status?.slice(1) || "Unknown"}
              </Badge>
            </div>
            <p className="text-neutral-500">Created {formatDate(barterOffer.createdAt || new Date())}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/barter")}>
              Back to Barter
            </Button>
            {barterOffer.status === "accepted" && (
              <Button 
                onClick={handleCreateSmartContract} 
                className="bg-secondary text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                Create Smart Contract
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Offering Commodity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-secondary" />
                Offered Commodity
              </CardTitle>
              <CardDescription>
                The commodity being offered in this barter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {barterOffer.offeringCommodity ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">{barterOffer.offeringCommodity.name}</h3>
                    <Badge variant="outline">Grade: {barterOffer.offeringCommodity.grade}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Volume</h4>
                      <p className="text-lg">
                        {formatNumber(barterOffer.offeringCommodity.volume)} {barterOffer.offeringCommodity.volumeUnit}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Value</h4>
                      <p className="text-lg">
                        {formatCurrency(barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume, "USD")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Price Unit</h4>
                      <p className="text-lg">
                        {formatCurrency(barterOffer.offeringCommodity.price, "USD")}/{barterOffer.offeringCommodity.priceUnit}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Status</h4>
                      <Badge variant="secondary" className="mt-1">
                        {barterOffer.offeringCommodity.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">Offered By</h4>
                    {barterOffer.offeringUser ? (
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={barterOffer.offeringUser.avatarUrl} alt={barterOffer.offeringUser.fullName} />
                          <AvatarFallback>{barterOffer.offeringUser.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{barterOffer.offeringUser.fullName}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="text-xs mr-2">
                              {barterOffer.offeringUser.verificationStatus || "Unverified"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => setIsZkpModalOpen(true)}
                            >
                              Verify Identity
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">User information not available</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  Commodity details not available
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Requesting Commodity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Requested Commodity
              </CardTitle>
              <CardDescription>
                The commodity being requested in this barter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {barterOffer.requestingCommodity ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">{barterOffer.requestingCommodity.name}</h3>
                    <Badge variant="outline">Grade: {barterOffer.requestingCommodity.grade}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Volume</h4>
                      <p className="text-lg">
                        {formatNumber(barterOffer.requestingCommodity.volume)} {barterOffer.requestingCommodity.volumeUnit}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Value</h4>
                      <p className="text-lg">
                        {formatCurrency(barterOffer.requestingCommodity.price * barterOffer.requestingCommodity.volume, "USD")}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Price Unit</h4>
                      <p className="text-lg">
                        {formatCurrency(barterOffer.requestingCommodity.price, "USD")}/{barterOffer.requestingCommodity.priceUnit}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500">Status</h4>
                      <Badge variant="secondary" className="mt-1">
                        {barterOffer.requestingCommodity.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">Owned By</h4>
                    {barterOffer.requestingUser ? (
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={barterOffer.requestingUser.avatarUrl} alt={barterOffer.requestingUser.fullName} />
                          <AvatarFallback>{barterOffer.requestingUser.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{barterOffer.requestingUser.fullName}</p>
                          <div className="flex items-center">
                            <Badge variant="outline" className="text-xs mr-2">
                              {barterOffer.requestingUser.verificationStatus || "Unverified"}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => setIsZkpModalOpen(true)}
                            >
                              Verify Identity
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-500 italic">User information not available</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  Commodity details not available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Value Match Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Value Match Analysis</CardTitle>
            <CardDescription>Analysis of the value match between the offered commodities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Value Match Score</span>
                  <span className={`text-lg font-bold ${getValueMatchColor(barterOffer.valueMatch)}`}>
                    {barterOffer.valueMatch}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Value Difference</span>
                  <span className="text-lg font-medium">
                    {getValueDifference()}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Offered Value</span>
                  <span className="text-lg">
                    {barterOffer.offeringCommodity 
                      ? formatCurrency(barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume, "USD") 
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Requested Value</span>
                  <span className="text-lg">
                    {barterOffer.requestingCommodity 
                      ? formatCurrency(barterOffer.requestingCommodity.price * barterOffer.requestingCommodity.volume, "USD") 
                      : "N/A"}
                  </span>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">AI-Powered Recommendation</h4>
                  <p className="text-sm text-neutral-600 mb-3">
                    {barterOffer.valueMatch >= 90 
                      ? "This barter offer has an excellent value match. We recommend accepting this offer as it represents fair market value for both parties."
                      : barterOffer.valueMatch >= 75
                        ? "This barter offer has a good value match. Consider accepting this offer as it's within a reasonable range of market values."
                        : "This barter offer has a poor value match. You may want to negotiate or counter with a different offer."}
                  </p>
                  {barterOffer.valueMatch < 90 && (
                    <p className="text-xs text-neutral-500">
                      For more balanced trades, consider adjusting commodity volumes or selecting different commodities.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          {canAcceptOrReject && (
            <CardFooter className="flex justify-end space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <X className="mr-2 h-4 w-4" />
                    Reject Offer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to reject this offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The offering party will be notified of your decision.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => rejectBarterMutation.mutate()}
                      className="bg-destructive"
                    >
                      {rejectBarterMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Yes, Reject Offer"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-success hover:bg-success/90 text-white">
                    <Check className="mr-2 h-4 w-4" />
                    Accept Offer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Accept this barter offer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      By accepting this offer, you agree to trade your commodity for the offered commodity. A smart contract will be generated to facilitate the exchange.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => acceptBarterMutation.mutate()}
                      className="bg-success"
                    >
                      {acceptBarterMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        "Yes, Accept Offer"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
        
        {/* Transaction Timeline (show only for accepted barters) */}
        {barterOffer.status === "accepted" && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Timeline</CardTitle>
              <CardDescription>Step-by-step progress of this barter transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-secondary/20"></div>
                
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-0 rounded-full bg-secondary w-6 h-6 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="text-md font-medium">Barter Offer Created</h4>
                  <p className="text-neutral-500 text-sm">{formatDate(barterOffer.createdAt || new Date())}</p>
                </div>
                
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-0 rounded-full bg-secondary w-6 h-6 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="text-md font-medium">Barter Offer Accepted</h4>
                  <p className="text-neutral-500 text-sm">Commodities ready for exchange</p>
                </div>
                
                <div className="relative pl-10 pb-6">
                  <div className="absolute left-0 rounded-full bg-neutral-200 w-6 h-6 flex items-center justify-center">
                    <span className="text-xs text-neutral-500">3</span>
                  </div>
                  <h4 className="text-md font-medium text-neutral-500">Smart Contract Generated</h4>
                  <p className="text-neutral-500 text-sm">Pending blockchain confirmation</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCreateSmartContract}
                  >
                    Generate Smart Contract
                  </Button>
                </div>
                
                <div className="relative pl-10">
                  <div className="absolute left-0 rounded-full bg-neutral-200 w-6 h-6 flex items-center justify-center">
                    <span className="text-xs text-neutral-500">4</span>
                  </div>
                  <h4 className="text-md font-medium text-neutral-500">Exchange Completed</h4>
                  <p className="text-neutral-500 text-sm">Awaiting final confirmation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* ZKP Verification Modal */}
      <ZkpVerificationModal 
        isOpen={isZkpModalOpen} 
        onOpenChange={setIsZkpModalOpen}
        counterpartyName={isOfferingUser ? barterOffer.requestingUser?.fullName : barterOffer.offeringUser?.fullName}
      />
      
      {/* Smart Contract Modals */}
      <SmartContractCreationModal
        isOpen={isSmartContractModalOpen}
        onOpenChange={setIsSmartContractModalOpen}
        buyerId={isOfferingUser ? barterOffer.requestingUserId?.toString() : user?.id.toString()}
        commodityId={barterOffer.offeringCommodityId?.toString()}
        onSuccess={handleSmartContractCreated}
      />
      
      <EscrowDepositModal
        isOpen={isEscrowDepositModalOpen}
        onOpenChange={setIsEscrowDepositModalOpen}
        contractAddress={contractAddress}
        defaultAmount={escrowAmount}
        onSuccess={handleEscrowDeposited}
      />
      
      <EscrowReleaseModal
        isOpen={isEscrowReleaseModalOpen}
        onOpenChange={setIsEscrowReleaseModalOpen}
        contractAddress={contractAddress}
        sellerId={isOfferingUser ? user?.id.toString() : barterOffer.offeringUserId?.toString()}
        onSuccess={handleEscrowReleased}
      />
    </AppShell>
  );
}