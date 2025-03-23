import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeSVG } from "qrcode.react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Loader2, ArrowRight, Banknote, KeyRound, CreditCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import the EscrowDepositModal
import EscrowDepositModal from "./escrow-deposit-modal";

// Form validation schema
const smartContractSchema = z.object({
  buyerId: z.string().min(1, "Buyer ID is required"),
  commodityId: z.string().min(1, "Commodity ID is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  ),
});

type SmartContractFormValues = z.infer<typeof smartContractSchema>;

interface SmartContractCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  buyerId?: string;
  commodityId?: string;
  onSuccess?: (contractData: any) => void;
}

export default function SmartContractCreationModal({
  isOpen,
  onOpenChange,
  buyerId = "",
  commodityId = "",
  onSuccess,
}: SmartContractCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"create" | "processing" | "complete">("create");
  const [contractData, setContractData] = useState<any>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const form = useForm<SmartContractFormValues>({
    resolver: zodResolver(smartContractSchema),
    defaultValues: {
      buyerId,
      commodityId,
      amount: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: SmartContractFormValues) => {
      setStep("processing");
      return apiRequest(
        "POST",
        "/api/smart-contracts/escrow",
        {
          buyerId: parseInt(data.buyerId),
          commodityId: parseInt(data.commodityId),
          amount: parseFloat(data.amount),
        }
      );
    },
    onSuccess: (data) => {
      setContractData(data);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Smart Contract Created",
        description: data.contractAddress 
          ? `Escrow contract created with address ${data.contractAddress.substring(0, 8)}...`
          : "Escrow contract created successfully",
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Contract",
        description: error.message,
        variant: "destructive",
      });
      setStep("create");
    },
  });

  const onSubmit = (data: SmartContractFormValues) => {
    createContractMutation.mutate(data);
  };

  const handleClose = () => {
    if (step !== "processing") {
      onOpenChange(false);
      // Reset form after modal is fully closed
      setTimeout(() => {
        form.reset();
        setStep("create");
        setContractData(null);
      }, 300);
    }
  };

  // Handle deposit modal actions
  const handleDepositSuccess = (depositData: any) => {
    setIsDepositModalOpen(false);
    
    // After successful deposit, we can close both modals or take another action
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  };

  // Function to open the deposit modal after contract creation
  const openDepositModal = () => {
    setIsDepositModalOpen(true);
  };

  // Fetch commodity details if commodityId is available
  const { data: commodityData } = useQuery({
    queryKey: ['/api/commodities', commodityId],
    queryFn: getQueryFn<any>({ on401: "throw" }),
    enabled: !!commodityId && buyerId !== "",
  });

  // Auto-fill default values when commodity data is available
  useEffect(() => {
    if (isOpen && buyerId && commodityId && commodityData && step === "create") {
      // Auto fill the amount based on commodity price if available
      const suggestedPrice = commodityData?.price || 0;
      if (suggestedPrice > 0) {
        form.setValue("amount", suggestedPrice.toString());
        // Trigger form validation after setting the value
        form.trigger("amount");
      }
    }
  }, [isOpen, buyerId, commodityId, commodityData, step]);
  
  // Add a manual start button instead of auto-submitting
  const [showManualForm, setShowManualForm] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "create" && <><KeyRound className="h-5 w-5 text-primary" /> Generate Smart Contract</>}
              {step === "processing" && <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Creating Smart Contract...</>}
              {step === "complete" && <><CheckCircle2 className="h-5 w-5 text-green-500" /> Smart Contract Created</>}
            </DialogTitle>
            <DialogDescription>
              {step === "create" && "Creating a secure blockchain contract for this commodity transaction."}
              {step === "processing" && "Please wait while the contract is being deployed to the blockchain."}
              {step === "complete" && "Your escrow contract has been successfully deployed to the blockchain."}
            </DialogDescription>
          </DialogHeader>

          {/* Create contract form */}
          {step === "create" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Amount ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter amount" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the amount for this transaction.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full flex items-center justify-center gap-2"
                  disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating Contract...</>
                  ) : (
                    <><KeyRound className="h-4 w-4" /> Generate Smart Contract</>
                  )}
                </Button>
              </form>
            </Form>
          )}
          
          {/* Processing animation */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-6 text-center text-muted-foreground">
                Creating your secure escrow contract on the blockchain...
                <br />
                <span className="text-xs">This may take a few moments.</span>
              </p>
            </div>
          )}

          {/* Contract complete view with QR code */}
          {step === "complete" && contractData && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* QR Code section */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="p-2 border border-muted-foreground/20 rounded-lg bg-white">
                    {contractData.contractAddress && (
                      <QRCodeSVG 
                        value={contractData.contractAddress}
                        size={160}
                        includeMargin={true}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        className="rounded-md"
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-center text-muted-foreground">Scan to view on blockchain</p>
                </div>

                {/* Contract details */}
                <div className="flex-1 rounded-md bg-muted p-4 space-y-3">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <KeyRound className="h-4 w-4" /> Contract Details
                  </h3>
                  <div className="space-y-2">
                    {contractData.contractAddress && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Contract Address</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs bg-primary/5 px-2 py-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                            {contractData.contractAddress}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {contractData.transactionHash && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Transaction Hash</div>
                        <div className="font-mono text-xs bg-muted-foreground/10 px-2 py-1 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                          {contractData.transactionHash}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Amount</div>
                        <div className="font-medium">${form.getValues().amount}</div>
                      </div>
                      {contractData.transactionId && (
                        <div>
                          <div className="text-xs text-muted-foreground">Transaction ID</div>
                          <div className="font-medium">{contractData.transactionId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Banknote className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-sm">Next Step: Deposit Funds</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your escrow smart contract has been created successfully. To proceed with the transaction, 
                      you need to deposit ${form.getValues().amount} to the escrow address.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={openDepositModal}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                >
                  <CreditCard className="h-4 w-4" />
                  Proceed to Deposit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Escrow Deposit Modal */}
      {contractData && (
        <EscrowDepositModal
          isOpen={isDepositModalOpen}
          onOpenChange={setIsDepositModalOpen}
          contractAddress={contractData.contractAddress || ""}
          defaultAmount={form.getValues().amount}
          onSuccess={handleDepositSuccess}
          isContractCreationResponse={true}
        />
      )}
    </>
  );
}