import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Copy, CheckCircle2, ArrowRightCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const depositFormSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  ),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

interface EscrowDepositModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress?: string;
  defaultAmount?: string;
  onSuccess?: (depositData: any) => void;
  // Added fixed amount and contract display mode
  isContractCreationResponse?: boolean;
}

export default function EscrowDepositModal({
  isOpen,
  onOpenChange,
  contractAddress = "",
  defaultAmount = "",
  onSuccess,
  isContractCreationResponse = false,
}: EscrowDepositModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"create" | "processing" | "complete">("create");
  const [depositData, setDepositData] = useState<any>(null);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      contractAddress,
      amount: defaultAmount,
    },
  });
  
  // Update form values when props change and auto-submit in contract creation mode
  useEffect(() => {
    console.log("Contract address changed:", contractAddress);
    if (contractAddress) {
      form.setValue("contractAddress", contractAddress);
    }
    if (defaultAmount) {
      form.setValue("amount", defaultAmount);
    }
    // Force form validation
    form.trigger();
    
    // Auto-submit if this is opened from contract creation and we have all data
    if (isOpen && isContractCreationResponse && contractAddress && defaultAmount) {
      console.log("Auto-submitting escrow deposit with amount:", defaultAmount);
      
      // Give a small delay to show the form first
      const timer = setTimeout(() => {
        if (form.formState.isValid) {
          onSubmit(form.getValues() as DepositFormValues);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, contractAddress, defaultAmount, isContractCreationResponse, form]);

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormValues) => {
      console.log("Submitting deposit with data:", data);
      setStep("processing");
      
      try {
        // Make API request directly to ensure proper handling
        const response = await fetch("/api/smart-contracts/escrow/deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractAddress: data.contractAddress,
            amount: parseFloat(data.amount),
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`API Error: ${response.status} ${errorText}`);
        }
        
        // Parse the response to get the data
        const responseData = await response.json();
        console.log("Deposit response data:", responseData);
        return responseData;
      } catch (error) {
        console.error("Deposit error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Deposit success data:", JSON.stringify(data, null, 2));
      setDepositData(data);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Funds Deposited",
        description: `Successfully deposited funds to escrow contract.`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Depositing Funds",
        description: error.message,
        variant: "destructive",
      });
      setStep("create");
    },
  });

  const onSubmit = (data: DepositFormValues) => {
    depositMutation.mutate(data);
  };

  const handleClose = () => {
    if (step !== "processing") {
      onOpenChange(false);
      // Reset form after modal is fully closed
      setTimeout(() => {
        form.reset();
        setStep("create");
        setDepositData(null);
      }, 300);
    }
  };

  // Add clipboard functionality for easy copying of contract address
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "create" && <><CreditCard className="h-5 w-5 text-primary" /> Deposit Funds to Escrow</>}
            {step === "processing" && <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Processing Deposit...</>}
            {step === "complete" && <><CheckCircle2 className="h-5 w-5 text-green-600" /> Deposit Complete</>}
          </DialogTitle>
          <DialogDescription>
            {step === "create" && "Deposit funds to the escrow contract to proceed with the secure transaction."}
            {step === "processing" && "Please wait while your deposit is being processed through the blockchain."}
            {step === "complete" && "Your funds have been securely deposited to the escrow contract."}
          </DialogDescription>
        </DialogHeader>

        {step === "create" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Contract details section with QR code for automated deposits */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {contractAddress && (
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="p-2 border border-muted-foreground/20 rounded-lg bg-white">
                      <QRCodeSVG 
                        value={contractAddress}
                        size={140}
                        includeMargin={true}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        className="rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-xs text-center text-muted-foreground">Scan to copy address</p>
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="contractAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Contract Address
                          {isContractCreationResponse && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Auto-Generated
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <div className="relative flex-1">
                              <Input 
                                {...field} 
                                disabled={true}
                                className={`pr-10 font-mono text-sm ${isContractCreationResponse ? "bg-green-50/50 border-green-200 text-green-800" : ""}`}
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={copyToClipboard}
                                title="Copy to clipboard"
                              >
                                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isContractCreationResponse 
                            ? "Secure blockchain address for this escrow transaction." 
                            : "The blockchain address of the escrow contract."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Deposit Amount
                          {isContractCreationResponse && !!defaultAmount && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Pre-calculated
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              disabled={isContractCreationResponse && !!defaultAmount}
                              className={`pl-7 ${isContractCreationResponse && !!defaultAmount ? "bg-green-50/50 border-green-200 text-green-800" : ""}`}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isContractCreationResponse && !!defaultAmount 
                            ? "This amount will be held in escrow until the transaction is completed." 
                            : "The amount to deposit into the escrow contract."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {isContractCreationResponse && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <ArrowRightCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Secure Transaction Info</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your deposit will be held in escrow until the delivery is confirmed. 
                        Once you confirm receipt of the commodity, funds will be released to the seller.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={isContractCreationResponse ? "bg-green-600 hover:bg-green-700 flex items-center gap-1" : ""}
                >
                  {isContractCreationResponse && <CreditCard className="h-4 w-4" />}
                  {isContractCreationResponse ? "Complete Deposit" : "Deposit Funds"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-6 text-center text-muted-foreground">
              Processing your deposit transaction on the blockchain...
              <br />
              <span className="text-xs">This may take a few moments to confirm.</span>
            </p>
          </div>
        )}

        {step === "complete" && depositData && (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Transaction Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {depositData.success ? "Confirmed" : "Failed"}
                </Badge>
              </div>
              
              {depositData.transactionHash && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Transaction Hash</div>
                  <div className="font-mono text-xs bg-muted-foreground/10 px-2 py-1 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {depositData.transactionHash}
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {depositData.success 
                ? "Your deposit has been confirmed and the funds are now securely held in the escrow contract. The seller will be notified to proceed with delivery."
                : "There was an issue with your deposit. Please try again or contact support for assistance."}
            </p>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}