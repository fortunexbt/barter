import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import AppShell from "@/components/layout/app-shell";
import { BarterOffer, Commodity, User, Contract, Transaction } from "@shared/schema";
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ArrowRight, User as UserIcon, Package, DollarSign, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ZkpVerificationModal from "@/components/modals/zkp-verification-modal";
import SmartContractCreationModal from "@/components/modals/smart-contract-creation-modal";
import EscrowDepositModal from "@/components/modals/escrow-deposit-modal";
import EscrowReleaseModal from "@/components/modals/escrow-release-modal";
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
  
  // Fetch related contracts
  const { data: relatedContracts, isLoading: isLoadingContracts } = useQuery<Contract[]>({
    queryKey: ['/api/contracts'],
    queryFn: async () => {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error("Failed to load contracts");
      return response.json();
    },
    enabled: !!barterOffer // Only run this query if we have the barter offer
  });

  // Fetch related transactions
  const { data: relatedTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error("Failed to load transactions");
      return response.json();
    },
    enabled: !!barterOffer // Only run this query if we have the barter offer
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

  // Contract state tracking
  const [contractCreated, setContractCreated] = useState(false);
  const [contractCreating, setContractCreating] = useState(false);
  const [depositCompleted, setDepositCompleted] = useState(false);
  const [depositStep, setDepositStep] = useState(false);
  const [tradeProgress, setTradeProgress] = useState(0);
  const [transactionStatus, setTransactionStatus] = useState("pending");
  
  // Track current contract data
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>([]);
  
  // Confetti effect
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Effect to find related contract and transactions for this barter
  useEffect(() => {
    if (barterOffer && relatedContracts && relatedTransactions) {
      // Find contract related to this barter
      const contractForBarter = relatedContracts.find(
        contract => contract.buyerId === barterOffer.requestingUserId && 
                    contract.sellerId === barterOffer.offeringUserId && 
                    contract.commodityId === barterOffer.offeringCommodityId
      );
      
      if (contractForBarter) {
        setCurrentContract(contractForBarter);
        setContractCreated(true);
        
        // If we have a contract address from metadata, use it
        const contractTransactions = relatedTransactions.filter(t => t.contractId === contractForBarter.id);
        if (contractTransactions.length > 0) {
          setCurrentTransactions(contractTransactions);
          
          // Check for deposit transaction
          const depositTx = contractTransactions.find(t => t.type === 'escrow_deposit');
          if (depositTx) {
            setDepositCompleted(true);
            setDepositStep(true);
          }
          
          // Update progress based on transaction status
          if (contractForBarter.status === 'completed') {
            setTransactionStatus('completed');
            setTradeProgress(100);
          } else if (contractForBarter.status === 'funded') {
            setTransactionStatus('funded');
            setTradeProgress(66);
          } else if (contractForBarter.status === 'pending' && depositTx) {
            setTradeProgress(33);
          } else if (contractForBarter.status === 'pending') {
            setTradeProgress(10);
          }
          
          // Extract contract address from transaction metadata if available
          const creationTx = contractTransactions.find(t => t.type === 'escrow_creation');
          if (creationTx && creationTx.metadata) {
            try {
              const metadata = JSON.parse(creationTx.metadata);
              if (metadata.contractAddress) {
                setContractAddress(metadata.contractAddress);
              }
            } catch (e) {
              console.error("Error parsing transaction metadata:", e);
            }
          }
        }
      }
    }
  }, [barterOffer, relatedContracts, relatedTransactions]);
  
  // Smart contract integration functions
  const handleCreateSmartContract = async () => {
    // Validate data first
    if (!barterOffer?.offeringCommodity || !barterOffer?.requestingCommodity) {
      toast({
        title: "Missing Commodity Data",
        description: "Cannot create smart contract: commodity data is missing",
        variant: "destructive"
      });
      return;
    }
    
    // Calculate the total value for escrow - use the commodity's total value
    // Most important improvement: multiply price by volume for accurate amount calculation
    const commodityTotalValue = barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume;
    const escrowAmountValue = commodityTotalValue;
    
    // Format escrow amount as string
    const escrowAmount = escrowAmountValue.toString();
    setEscrowAmount(escrowAmount);
    
    // Show loading state
    setContractCreating(true);
    
    try {
      // Create contract directly through API
      const response = await fetch("/api/smart-contracts/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Only send the necessary fields that the API expects
          buyerId: barterOffer.requestingUser?.id,
          commodityId: barterOffer.offeringCommodity.id,
          amount: commodityTotalValue,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }
      
      // Parse the response to get the data
      const responseData = await response.json();
      console.log("Contract created API response data:", responseData);
      
      // Store the contract address for deposit and release operations
      setContractAddress(responseData.contractAddress);
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: [`/api/barter/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // Show success state
      setContractCreated(true);
      setContractCreating(false);
      
      // Trigger confetti effect for visual feedback
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Success notification with clear next steps
      toast({
        title: "Smart Contract Created!",
        description: "Your contract has been generated successfully. You can now deposit funds to escrow.",
      });
      
      return responseData;
    } catch (error) {
      console.error("Contract creation error:", error);
      setContractCreating(false);
      
      toast({
        title: "Error Creating Contract",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleDepositToEscrow = () => {
    if (!contractAddress) {
      toast({
        title: "Missing Contract Address",
        description: "Please create a smart contract first",
        variant: "destructive"
      });
      return;
    }
    
    if (!escrowAmount) {
      // Calculate escrow amount if not already set
      if (barterOffer?.offeringCommodity) {
        const commodityTotalValue = barterOffer.offeringCommodity.price * barterOffer.offeringCommodity.volume;
        setEscrowAmount(commodityTotalValue.toString());
      } else {
        toast({
          title: "Missing Commodity Data",
          description: "Cannot determine escrow amount: commodity data is missing",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Enable deposit step
    setDepositStep(true);
    
    // Open the deposit modal with auto-populated values
    setIsEscrowDepositModalOpen(true);
  };
  
  const handleSmartContractCreated = (data: any) => {
    // This function is no longer used for the actual contract creation
    // but keeping it for compatibility with the existing components
    console.log("Contract created callback with data:", data);
  };
  
  const handleEscrowDeposited = (data: any) => {
    // Mark deposit as completed
    setDepositCompleted(true);
    setIsEscrowDepositModalOpen(false);
    
    // Trigger success animation/confetti to provide clear visual feedback
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Show detailed success message with amount
    const amount = data?.amount || escrowAmount;
    toast({
      title: "Escrow Deposit Complete",
      description: `$${amount} has been successfully deposited to the escrow contract. The seller will be notified to proceed with delivery.`,
    });
    
    // Refresh all relevant data
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    queryClient.invalidateQueries({ queryKey: [`/api/barter/${id}`] });
    queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
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
                  
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">Requested By</h4>
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
        
        {/* Value Comparison */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Value Analysis
            </CardTitle>
            <CardDescription>
              Comparison of commodity values for this barter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Value Match Score</h4>
                <p className={`text-lg font-medium ${getValueMatchColor(barterOffer.valueMatch)}`}>
                  {barterOffer.valueMatch}%
                </p>
                <p className="text-xs text-neutral-500">
                  {barterOffer.valueMatch >= 95 
                    ? "Excellent match" 
                    : barterOffer.valueMatch >= 80 
                      ? "Good match" 
                      : "Poor match"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Value Difference</h4>
                <p className="text-lg font-medium">
                  {getValueDifference()}%
                </p>
                <p className="text-xs text-neutral-500">
                  Percentage difference between commodity values
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500">Recommendation</h4>
                {barterOffer.valueMatch >= 90 ? (
                  <Badge variant="success" className="mb-1">Proceed with confidence</Badge>
                ) : barterOffer.valueMatch >= 75 ? (
                  <Badge variant="warning" className="mb-1">Consider carefully</Badge>
                ) : (
                  <Badge variant="destructive" className="mb-1">Not recommended</Badge>
                )}
                <p className="text-xs text-neutral-500">
                  {barterOffer.valueMatch >= 90 
                    ? "This is a fair trade with balanced value" 
                    : barterOffer.valueMatch >= 75 
                      ? "The value is slightly imbalanced" 
                      : "Significant value disparity exists"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Actions */}
        {barterOffer.status === "pending" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Barter Actions</CardTitle>
              <CardDescription>
                Accept or reject this barter offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                {canAcceptOrReject ? (
                  <div className="flex flex-wrap gap-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="success" className="min-w-[120px]">
                          <Check className="mr-2 h-4 w-4" />
                          Accept Offer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Accept Barter Offer?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Accepting this offer will initiate the barter process. You will exchange your commodity with the offered one. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => acceptBarterMutation.mutate()}>
                            {acceptBarterMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Accept Offer"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="min-w-[120px]">
                          <X className="mr-2 h-4 w-4" />
                          Reject Offer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Barter Offer?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject this barter offer? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => rejectBarterMutation.mutate()}>
                            {rejectBarterMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Reject Offer"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <p className="text-neutral-500 italic">
                    This offer is waiting for a response from {barterOffer.requestingUser?.username || "the other party"}.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Contract Timeline for Accepted Offers */}
        {barterOffer.status === "accepted" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                Smart Contract Timeline
              </CardTitle>
              <CardDescription>
                Secure your barter with a smart contract escrow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show confetti if contract was just created */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Simple confetti effect using tailwind animations */}
                  <div className="absolute left-1/4 top-0 w-3 h-3 bg-green-500 animate-fall-slow" style={{animationDelay: '0.2s'}} />
                  <div className="absolute left-1/3 top-0 w-2 h-2 bg-blue-500 animate-fall-slow" style={{animationDelay: '0.5s'}} />
                  <div className="absolute left-1/2 top-0 w-4 h-4 bg-yellow-500 animate-fall-slow" style={{animationDelay: '0.3s'}} />
                  <div className="absolute left-2/3 top-0 w-2 h-2 bg-red-500 animate-fall-slow" style={{animationDelay: '0.7s'}} />
                  <div className="absolute left-3/4 top-0 w-3 h-3 bg-purple-500 animate-fall-slow" style={{animationDelay: '0.1s'}} />
                </div>
              )}
              
              {/* Overall Progress Indicator */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <h4 className="text-sm font-medium">Transaction Progress</h4>
                  <span className="text-sm text-neutral-500">{tradeProgress}%</span>
                </div>
                <Progress value={tradeProgress} className="h-2" />
              </div>
              
              {/* Contract Details if available */}
              {currentContract && (
                <div className="mb-6 bg-slate-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Contract Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-neutral-500">Contract ID:</span>
                      <p>{currentContract.contractNumber}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500">Status:</span>
                      <p className={currentContract.status === 'completed' ? 'text-green-600' : 'text-orange-500'}>
                        {currentContract.status?.charAt(0).toUpperCase() + currentContract.status?.slice(1) || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500">Created:</span>
                      <p>{formatRelativeTime(currentContract.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500">Price:</span>
                      <p>{formatCurrency(currentContract.price, 'USD')}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Transaction History if available */}
              {currentTransactions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Transaction History</h4>
                  <div className="space-y-2">
                    {currentTransactions.map((tx) => (
                      <div key={tx.id} className="text-sm bg-slate-50 p-2 rounded-md flex justify-between">
                        <div>
                          <span className="font-medium">
                            {tx.type === 'escrow_creation' && 'Contract Created'}
                            {tx.type === 'escrow_deposit' && 'Funds Deposited'}
                            {tx.type === 'escrow_release' && 'Funds Released'}
                          </span>
                          <p className="text-neutral-500">{formatRelativeTime(tx.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={tx.status === 'completed' ? 'default' : 'outline'}>
                            {tx.status}
                          </Badge>
                          {tx.amount && <p>{formatCurrency(tx.amount, 'USD')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-6 relative">
                {/* Step 1: Create Smart Contract */}
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${contractCreated ? 'bg-green-500 text-white' : 'bg-secondary text-white'}`}>
                      {contractCreated ? <Check className="h-4 w-4" /> : 1}
                    </div>
                    <div className="h-full w-px bg-secondary/20" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${contractCreated ? 'text-green-700' : ''}`}>
                      Create Smart Contract
                    </h4>
                    <p className="text-neutral-500 text-sm mb-2">
                      {contractCreated 
                        ? `Contract created with address ${contractAddress.substring(0, 8)}...` 
                        : "Initialize a secure escrow contract for this barter"}
                    </p>
                    {contractCreating ? (
                      <Button 
                        size="sm"
                        className="bg-secondary text-white"
                        disabled
                      >
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Creating...
                      </Button>
                    ) : contractCreated ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="mr-1 h-3 w-3" /> Contract Created
                      </Badge>
                    ) : (
                      <Button 
                        onClick={handleCreateSmartContract}
                        size="sm"
                        className="bg-secondary text-white"
                      >
                        Create Contract
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Step 2: Deposit Funds to Escrow */}
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      depositCompleted 
                        ? 'bg-green-500 text-white' 
                        : contractCreated 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-neutral-200'
                    }`}>
                      {depositCompleted ? <Check className="h-4 w-4" /> : 2}
                    </div>
                    <div className="h-full w-px bg-neutral-200" />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      depositCompleted 
                        ? 'text-green-700' 
                        : contractCreated 
                          ? 'text-blue-700' 
                          : 'text-neutral-500'
                    }`}>
                      Deposit Funds to Escrow
                    </h4>
                    <p className="text-neutral-500 text-sm mb-2">
                      {depositCompleted 
                        ? "Funds successfully deposited to escrow" 
                        : "Lock funds in the escrow contract to secure the transaction"}
                    </p>
                    {depositCompleted ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="mr-1 h-3 w-3" /> Deposit Complete
                      </Badge>
                    ) : (
                      <Button 
                        onClick={handleDepositToEscrow}
                        size="sm"
                        variant={contractCreated ? "default" : "outline"}
                        className={contractCreated ? "bg-blue-500 hover:bg-blue-600" : ""}
                        disabled={!contractCreated}
                      >
                        Deposit to Escrow
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Step 3: Release Funds to Seller */}
                <div className="flex">
                  <div className="mr-4 flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      depositCompleted ? 'bg-blue-500 text-white' : 'bg-neutral-200'
                    }`}>
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className={`font-medium ${depositCompleted ? 'text-blue-700' : 'text-neutral-500'}`}>
                      Release Funds to Seller
                    </h4>
                    <p className="text-neutral-500 text-sm mb-2">
                      Release escrow funds after confirming delivery
                    </p>
                    <Button 
                      onClick={() => setIsEscrowReleaseModalOpen(true)}
                      size="sm"
                      variant={depositCompleted ? "default" : "outline"}
                      className={depositCompleted ? "bg-blue-500 hover:bg-blue-600" : ""}
                      disabled={!depositCompleted}
                    >
                      Release Escrow
                    </Button>
                  </div>
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