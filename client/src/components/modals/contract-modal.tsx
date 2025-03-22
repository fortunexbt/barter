import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Contract } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContractModalProps {
  contractId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractModal({ contractId, isOpen, onOpenChange }: ContractModalProps) {
  const { toast } = useToast();
  
  const { data: contract, isLoading, error } = useQuery<Contract>({
    queryKey: ["/api/contracts", contractId],
    queryFn: async ({ queryKey }) => {
      const [_, id] = queryKey;
      if (!id) return null;
      const response = await fetch(`/api/contracts/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch contract details");
      }
      return response.json();
    },
    enabled: !!contractId && isOpen,
  });
  
  const signContractMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) return;
      await apiRequest("PUT", `/api/contracts/${contractId}`, { status: "signed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId] });
      toast({
        title: "Contract signed successfully",
        description: "The contract has been signed and is now in effect.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to sign contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSignContract = () => {
    signContractMutation.mutate();
  };

  const handleDownloadContract = () => {
    toast({
      title: "Download started",
      description: "The contract PDF is being prepared for download.",
    });
    // In a real app, this would trigger a download
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-600">Contract Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error || !contract ? (
          <div className="py-4 text-center text-red-500">
            Failed to load contract details
          </div>
        ) : (
          <>
            <div className="py-4">
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="material-icons text-primary">description</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-neutral-600">{contract.title || `Trade Contract #${contract.contractNumber}`}</h4>
                    <p className="text-xs text-neutral-400">
                      Created: {new Date(contract.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-xs font-medium text-neutral-500 uppercase mb-2">Parties</h5>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-600">Seller:</span>
                  <span className="text-sm font-medium text-neutral-600">Seller #{contract.sellerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Buyer:</span>
                  <span className="text-sm font-medium text-neutral-600">Buyer #{contract.buyerId}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-xs font-medium text-neutral-500 uppercase mb-2">Commodity Details</h5>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-600">Commodity ID:</span>
                  <span className="text-sm font-medium text-neutral-600">#{contract.commodityId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-600">Quantity:</span>
                  <span className="text-sm font-medium text-neutral-600">{contract.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Price:</span>
                  <span className="text-sm font-medium text-neutral-600">${contract.price.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-xs font-medium text-neutral-500 uppercase mb-2">Terms & Conditions</h5>
                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                  <div className="text-sm text-neutral-600 font-mono overflow-auto max-h-32 scrollbar-hide whitespace-pre-line">
                    {contract.terms}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-xs font-medium text-neutral-500 uppercase mb-2">Status</h5>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    contract.status === "signed" 
                      ? "bg-success bg-opacity-10 text-success" 
                      : contract.status === "pending" 
                        ? "bg-warning bg-opacity-10 text-warning"
                        : "bg-neutral-200 text-neutral-500"
                  }`}>
                    {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="bg-neutral-50 py-4 px-6 -mx-6 -mb-6 mt-2 flex flex-col sm:flex-row-reverse gap-2">
              {contract.status === "pending" && (
                <Button 
                  onClick={handleSignContract}
                  disabled={signContractMutation.isPending}
                  className="px-4 py-2 bg-primary text-white"
                >
                  {signContractMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    "Sign Contract"
                  )}
                </Button>
              )}
              <Button 
                onClick={handleDownloadContract}
                variant="outline" 
                className="px-4 py-2 border-neutral-300 text-neutral-600"
              >
                Download PDF
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
