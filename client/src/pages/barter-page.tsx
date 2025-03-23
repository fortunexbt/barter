import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { BarterOffer, Commodity, InsertBarterOffer } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Filter, ArrowRight, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function BarterPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [offeringCommodityId, setOfferingCommodityId] = useState("");
  const [requestingCommodityId, setRequestingCommodityId] = useState("");
  
  // Fetch barter offers
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
  
  // Fetch user's commodities for the dialog
  const { data: userCommodities, isLoading: loadingUserCommodities } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities/mine"],
    queryFn: async () => {
      // In a real app, this endpoint would filter by current user
      // Simulating this filter for demo purposes
      const response = await fetch("/api/commodities");
      if (!response.ok) {
        throw new Error("Failed to fetch user commodities");
      }
      const allCommodities = await response.json();
      return allCommodities.filter(c => c.ownerId === user?.id);
    }
  });
  
  // Fetch available commodities for the dialog
  const { data: availableCommodities, isLoading: loadingAvailableCommodities } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities/available"],
    queryFn: async () => {
      // In a real app, this endpoint would filter by available status and exclude user's own
      // Simulating this filter for demo purposes
      const response = await fetch("/api/commodities");
      if (!response.ok) {
        throw new Error("Failed to fetch available commodities");
      }
      const allCommodities = await response.json();
      return allCommodities.filter(c => c.status === "available" && c.ownerId !== user?.id);
    }
  });
  
  // Create barter offer mutation
  const createBarterMutation = useMutation({
    mutationFn: async (barterData: InsertBarterOffer) => {
      const res = await apiRequest("POST", "/api/barter", barterData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/barter"] });
      toast({
        title: "Barter offer created",
        description: "Your barter offer has been sent successfully",
      });
      setCreateDialogOpen(false);
      setOfferingCommodityId("");
      setRequestingCommodityId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create barter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Accept barter offer mutation
  const acceptBarterMutation = useMutation({
    mutationFn: async (barterId: number) => {
      const res = await apiRequest("PUT", `/api/barter/${barterId}`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
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
    mutationFn: async (barterId: number) => {
      const res = await apiRequest("PUT", `/api/barter/${barterId}`, { status: "rejected" });
      return await res.json();
    },
    onSuccess: () => {
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
  
  const handleCreateBarter = () => {
    if (!offeringCommodityId || !requestingCommodityId) {
      toast({
        title: "Incomplete form",
        description: "Please select both commodities to create a barter offer",
        variant: "destructive",
      });
      return;
    }
    
    const offeringCommodity = userCommodities?.find(c => c.id.toString() === offeringCommodityId);
    const requestingCommodity = availableCommodities?.find(c => c.id.toString() === requestingCommodityId);
    
    if (!offeringCommodity || !requestingCommodity) {
      toast({
        title: "Invalid selection",
        description: "The selected commodities are invalid",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate value match (simplified - in a real app, this would be more sophisticated)
    const offeringValue = offeringCommodity.price * offeringCommodity.volume;
    const requestingValue = requestingCommodity.price * requestingCommodity.volume;
    const valueMatch = Math.round((Math.min(offeringValue, requestingValue) / Math.max(offeringValue, requestingValue)) * 100);
    
    const barterData: InsertBarterOffer = {
      title: `Your ${offeringCommodity.name} for ${requestingCommodity.name}`,
      offeringCommodityId: offeringCommodity.id,
      requestingCommodityId: requestingCommodity.id,
      offeringUserId: user!.id,
      requestingUserId: requestingCommodity.ownerId,
      valueMatch,
      status: "pending",
    };
    
    createBarterMutation.mutate(barterData);
  };
  
  const getFilteredBarterOffers = () => {
    if (!barterOffers) return [];
    
    return barterOffers.filter(offer => {
      const matchesSearch = 
        offer.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        offer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };
  
  const filteredBarterOffers = getFilteredBarterOffers();
  
  const getStatusColor = (status: string) => {
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

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Barter System</h2>
            <p className="text-neutral-500">Exchange commodities without cash</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  New Barter Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Barter Offer</DialogTitle>
                  <DialogDescription>
                    Propose an exchange of commodities without cash.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Your Commodity</h4>
                    <Select value={offeringCommodityId} onValueChange={setOfferingCommodityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your commodity to offer" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingUserCommodities ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : !userCommodities || userCommodities.length === 0 ? (
                          <div className="p-2 text-center text-sm text-neutral-500">
                            No commodities available to offer
                          </div>
                        ) : (
                          userCommodities.map(commodity => (
                            <SelectItem key={commodity.id} value={commodity.id.toString()}>
                              {commodity.name} ({commodity.volume} {commodity.volumeUnit})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="text-secondary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Commodity You Want</h4>
                    <Select value={requestingCommodityId} onValueChange={setRequestingCommodityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select commodity you want" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingAvailableCommodities ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : !availableCommodities || availableCommodities.length === 0 ? (
                          <div className="p-2 text-center text-sm text-neutral-500">
                            No commodities available to request
                          </div>
                        ) : (
                          availableCommodities.map(commodity => (
                            <SelectItem key={commodity.id} value={commodity.id.toString()}>
                              {commodity.name} ({commodity.volume} {commodity.volumeUnit})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateBarter}
                    disabled={createBarterMutation.isPending || !offeringCommodityId || !requestingCommodityId}
                    className="bg-secondary text-white"
                  >
                    {createBarterMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Offer"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search barter offers..."
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
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="accepted">Accepted</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rejected">Rejected</DropdownMenuRadioItem>
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
            Failed to load barter offers
          </div>
        ) : filteredBarterOffers.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No barter offers found matching your criteria
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBarterOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-secondary bg-opacity-10 p-2 rounded-full">
                          <ArrowRight className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <h4 className="ml-3 text-sm font-medium text-neutral-600">{offer.title}</h4>
                          <div className="ml-3 mt-1 flex flex-wrap gap-4">
                            <div className="flex items-center">
                              <span className="text-xs text-neutral-500">Value match:</span>
                              <span className={`ml-1 text-xs font-medium ${getValueMatchColor(offer.valueMatch)}`}>{offer.valueMatch}%</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-neutral-500">Status:</span>
                              <Badge variant="outline" className={`ml-1 ${getStatusColor(offer.status)}`}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs text-neutral-500">Created:</span>
                              <span className="ml-1 text-xs font-medium text-neutral-600">
                                {formatDate(offer.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {offer.status === "pending" && (
                      <div className="mt-4 sm:mt-0 flex gap-2">
                        {offer.requestingUserId === user?.id && (
                          <>
                            <Button 
                              onClick={() => acceptBarterMutation.mutate(offer.id)}
                              disabled={acceptBarterMutation.isPending}
                              size="sm" 
                              className="bg-success text-white"
                            >
                              Accept
                            </Button>
                            <Button 
                              onClick={() => rejectBarterMutation.mutate(offer.id)}
                              disabled={rejectBarterMutation.isPending}
                              size="sm" 
                              variant="outline" 
                              className="border-error text-error"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Link href={`/barter/${offer.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    {offer.status !== "pending" && (
                      <div className="mt-4 sm:mt-0">
                        <Link href={`/barter/${offer.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
