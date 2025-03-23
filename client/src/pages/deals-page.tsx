import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppShell from "@/components/layout/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { Transaction, BarterOffer, Contract } from "@shared/schema";
import ZkpVerificationModal from "@/components/modals/zkp-verification-modal";
import SmartContractModal from "@/components/modals/smart-contract-modal";

export default function DealsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [showZkpModal, setShowZkpModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState<"created" | "completed">("created");
  const [selectedCounterparty, setSelectedCounterparty] = useState<string>("");
  
  // Fetch user's transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/user"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch user's barter offers
  const { data: barterOffers, isLoading: isLoadingBarterOffers } = useQuery<BarterOffer[]>({
    queryKey: ["/api/barter-offers/user"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch user's contracts
  const { data: contracts, isLoading: isLoadingContracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts/user"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch user details for each user ID in the transactions/contracts
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch commodities for reference
  const { data: commodities } = useQuery({
    queryKey: ["/api/commodities"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const isLoading = isLoadingTransactions || isLoadingBarterOffers || isLoadingContracts;
  
  // Filter deals based on active tab
  const filterDeals = (status: string) => {
    const filteredTransactions = transactions?.filter(t => 
      (status === "active" && ["pending", "processing", "in_escrow"].includes(t.status)) ||
      (status === "completed" && t.status === "completed") ||
      (status === "all")
    ) || [];
    
    const filteredContracts = contracts?.filter(c => 
      (status === "active" && ["draft", "signed", "in_progress"].includes(c.status || "")) ||
      (status === "completed" && c.status === "completed") ||
      (status === "all")
    ) || [];
    
    const filteredBarterOffers = barterOffers?.filter(b => 
      (status === "active" && b.status === "active") ||
      (status === "completed" && b.status === "completed") ||
      (status === "all")
    ) || [];
    
    return {
      transactions: filteredTransactions,
      contracts: filteredContracts,
      barterOffers: filteredBarterOffers
    };
  };
  
  const filteredDeals = filterDeals(activeTab);
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-0">Completed</Badge>;
      case "in_progress":
      case "in_escrow":
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 border-0">In Progress</Badge>;
      case "pending":
      case "draft":
      case "active":
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-0">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const handleVerifyCounterparty = (name: string) => {
    setSelectedCounterparty(name);
    setShowZkpModal(true);
  };
  
  const handleViewContract = (type: "created" | "completed") => {
    setSelectedContractType(type);
    setShowContractModal(true);
  };
  
  const getCommodityName = (id: number) => {
    return commodities?.find(c => c.id === id)?.name || "Unknown Commodity";
  };
  
  const getUserName = (id: number) => {
    return users?.find(u => u.id === id)?.fullName || "Unknown User";
  };
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">My Deals</h2>
          <p className="text-neutral-500">Track and manage all your trades, barters, and contracts</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Deals</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Deals</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Contracts Section */}
                {filteredDeals.contracts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contracts</CardTitle>
                      <CardDescription>
                        Formal agreements between you and your trading partners
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {filteredDeals.contracts.map((contract) => (
                          <div key={contract.id} className="border rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {getCommodityName(contract.commodityId)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Contract #{contract.contractNumber || `CT-${contract.id.toString().padStart(4, '0')}`}
                                </p>
                              </div>
                              <div className="mt-2 sm:mt-0">
                                {getStatusBadge(contract.status || "pending")}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Buyer</p>
                                <p className="text-sm font-medium">{getUserName(contract.buyerId)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Seller</p>
                                <p className="text-sm font-medium">{getUserName(contract.sellerId)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="text-sm font-medium">${contract.amount?.toLocaleString()} for {contract.quantity} units</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col xs:flex-row gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleViewContract(contract.status === "completed" ? "completed" : "created")}
                              >
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                View Contract
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleVerifyCounterparty(
                                  user?.id === contract.buyerId 
                                    ? getUserName(contract.sellerId) 
                                    : getUserName(contract.buyerId)
                                )}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Verify Counterparty
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Barter Offers Section */}
                {filteredDeals.barterOffers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Barter Offers</CardTitle>
                      <CardDescription>
                        Direct commodity exchange proposals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {filteredDeals.barterOffers.map((offer) => (
                          <div key={offer.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold">Barter Offer #{offer.id}</h3>
                              {getStatusBadge(offer.status || "active")}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <div className="bg-neutral-50 p-3 rounded-md">
                                <p className="text-xs text-primary font-medium">Offering</p>
                                <p className="text-sm font-medium">{getCommodityName(offer.offeredCommodityId || 0)}</p>
                                <p className="text-xs text-muted-foreground">Quantity: {offer.offerVolume}</p>
                              </div>
                              
                              <div className="bg-neutral-50 p-3 rounded-md">
                                <p className="text-xs text-primary font-medium">In Exchange For</p>
                                <p className="text-sm font-medium">{getCommodityName(offer.desiredCommodityId || 0)}</p>
                                <p className="text-xs text-muted-foreground">Quantity: {offer.desiredVolume}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center">
                                <p className="text-xs text-muted-foreground mr-1">Match Score:</p>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {offer.matchScore || 85}%
                                </Badge>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleVerifyCounterparty("Trading Partner")}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Verify Counterparty
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Transactions Section */}
                {filteredDeals.transactions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Transactions</CardTitle>
                      <CardDescription>
                        Financial transfers related to your trades
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {filteredDeals.transactions.map((transaction) => (
                          <div key={transaction.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h3 className="font-semibold">
                                  Transaction #{transaction.id.toString().padStart(4, '0')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transaction.createdAt || new Date()).toLocaleDateString()}
                                </p>
                              </div>
                              {getStatusBadge(transaction.status || "pending")}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">From</p>
                                <p className="text-sm font-medium">{getUserName(transaction.senderId)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">To</p>
                                <p className="text-sm font-medium">{getUserName(transaction.receiverId)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className="text-sm font-medium">${transaction.amount?.toLocaleString() || 0}</p>
                              </div>
                            </div>
                            
                            {transaction.commodityId && (
                              <div className="bg-neutral-50 p-3 rounded-md mb-4">
                                <p className="text-xs text-muted-foreground">Related Commodity</p>
                                <p className="text-sm font-medium">{getCommodityName(transaction.commodityId)}</p>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => handleViewContract(transaction.status === "completed" ? "completed" : "created")}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                View on Blockchain
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Empty State */}
                {filteredDeals.contracts.length === 0 && 
                  filteredDeals.barterOffers.length === 0 && 
                  filteredDeals.transactions.length === 0 && (
                    <div className="bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No deals found</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any {activeTab !== "all" ? activeTab : ""} deals at the moment.
                      </p>
                      <Button>Go to Marketplace</Button>
                    </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modals */}
      <ZkpVerificationModal 
        isOpen={showZkpModal} 
        onOpenChange={setShowZkpModal}
        counterpartyName={selectedCounterparty}
      />
      
      <SmartContractModal 
        isOpen={showContractModal} 
        onOpenChange={setShowContractModal}
        type={selectedContractType}
      />
    </AppShell>
  );
}