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
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      // Also invalidate barter data to update the contract status in the UI
      queryClient.invalidateQueries({ queryKey: ['/api/barter'] });
      
      // Show more detailed success message with the amount
      const amount = form.getValues().amount;
      toast({
        title: "Notional Deposit Recorded",
        description: `Recorded $${amount} in the local settlement simulation. No funds moved.`,
      });
      
      // Handle the success callback with improved timing
      if (onSuccess) {
        if (isContractCreationResponse) {
          // For the automatic contract creation flow, give user time to see success state
          // before the modal is closed and UI updated
          setTimeout(() => {
            onSuccess(data);
          }, 2000);
        } else {
          onSuccess(data);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Recording Deposit",
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
            {step === "create" && <><CreditCard className="h-5 w-5 text-primary" /> Record Notional Deposit</>}
            {step === "processing" && <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Recording Deposit...</>}
            {step === "complete" && <><CheckCircle2 className="h-5 w-5 text-green-600" /> Deposit State Recorded</>}
          </DialogTitle>
          <DialogDescription>
            {step === "create" && "Record a notional amount to advance the local settlement simulation."}
            {step === "processing" && "The prototype is writing the deposit state to its local journal."}
            {step === "complete" && "The notional deposit was recorded. No funds were held or transferred."}
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
                          Simulation Reference
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
                            ? "Generated reference for this local simulation."
                            : "The local agreement simulation reference."}
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
                            ? "This amount is notional and exists only in prototype state."
                            : "The notional amount to record in the simulation."}
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
                      <h3 className="font-medium text-sm">Simulation Boundary</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This action changes only local prototype state. It does not hold funds, confirm delivery,
                        or instruct a seller.
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
                  {isContractCreationResponse ? "Record Deposit" : "Record Notional"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-6 text-center text-muted-foreground">
              Recording the notional deposit in the local prototype...
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
                ? "The notional deposit state is recorded locally. No funds are held and no seller was contacted."
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
