import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Copy, 
  Banknote, 
  ArrowRightCircle,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const releaseFormSchema = z.object({
  contractAddress: z.string().min(1, "Contract address is required"),
  sellerId: z.string().min(1, "Seller ID is required"),
});

type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

interface EscrowReleaseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress?: string;
  sellerId?: string;
  onSuccess?: (releaseData: any) => void;
}

export default function EscrowReleaseModal({
  isOpen,
  onOpenChange,
  contractAddress = "",
  sellerId = "",
  onSuccess,
}: EscrowReleaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"confirm" | "processing" | "complete">("confirm");
  const [releaseData, setReleaseData] = useState<any>(null);

  // Force update default values when props change
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      contractAddress: contractAddress || "",
      sellerId: sellerId || "",
    },
  });
  
  // Important: Update form values when props change
  useEffect(() => {
    if (contractAddress) {
      form.setValue("contractAddress", contractAddress);
      console.log("Contract address updated in form:", contractAddress);
    }
    if (sellerId) {
      form.setValue("sellerId", sellerId);
    }
  }, [contractAddress, sellerId, form]);

  const releaseMutation = useMutation({
    mutationFn: async (data: ReleaseFormValues) => {
      console.log("Submitting release with data:", data);
      setStep("processing");
      
      try {
        // Make API request directly to ensure proper handling
        const response = await fetch("/api/smart-contracts/escrow/release", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractAddress: data.contractAddress,
            sellerId: parseInt(data.sellerId),
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`API Error: ${response.status} ${errorText}`);
        }
        
        // Parse the response to get the data
        const responseData = await response.json();
        console.log("Release response data:", responseData);
        return responseData;
      } catch (error) {
        console.error("Release error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setReleaseData(data);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Notional Release Recorded",
        description: `Recorded a local release state. No funds moved and no seller was paid.`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Recording Release",
        description: error.message,
        variant: "destructive",
      });
      setStep("confirm");
    },
  });

  const onSubmit = (data: ReleaseFormValues) => {
    releaseMutation.mutate(data);
  };

  const handleClose = () => {
    if (step !== "processing") {
      onOpenChange(false);
      // Reset form after modal is fully closed
      setTimeout(() => {
        form.reset();
        setStep("confirm");
        setReleaseData(null);
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
            {step === "confirm" && <><ShieldCheck className="h-5 w-5 text-amber-500" /> Record Notional Release</>}
            {step === "processing" && <><Loader2 className="h-5 w-5 animate-spin text-primary" /> Recording Release...</>}
            {step === "complete" && <><CheckCircle2 className="h-5 w-5 text-green-600" /> Release State Recorded</>}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" && "Confirm the next state in this local settlement simulation."}
            {step === "processing" && "The prototype is writing the release state to its local journal."}
            {step === "complete" && "The notional release was recorded. No funds were transferred."}
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" && (
          <>
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700">Important - Confirm Delivery</AlertTitle>
              <AlertDescription className="text-amber-700/80">
                This action marks the prototype agreement as released. It is not a payment instruction and
                does not prove receipt of any commodity.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contractAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Simulation Reference
                          <Badge variant="outline" className="text-xs bg-muted/50">
                            Fixture
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              disabled={!!contractAddress} 
                              className="pr-10 font-mono text-sm"
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
                        </FormControl>
                        <FormDescription className="text-xs">
                          The generated reference for this local agreement simulation.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller ID</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!!sellerId} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          The fixture seller attached to the simulated release.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Delivery Confirmation</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recording this step only advances local prototype state. It does not certify delivery
                        or authorize any financial transfer.
                      </p>
                    </div>
                  </div>
                </div>

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
                    className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1"
                  >
                    <Banknote className="h-4 w-4" />
                    Record Release State
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-6 text-center text-muted-foreground">
              Recording the notional release in the local prototype...
              <br />
              <span className="text-xs">This may take a few moments to confirm.</span>
            </p>
          </div>
        )}

        {step === "complete" && releaseData && (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Transaction Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {releaseData.success ? "Confirmed" : "Failed"}
                </Badge>
              </div>
              
              {releaseData.transactionHash && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Transaction Hash</div>
                  <div className="font-mono text-xs bg-muted-foreground/10 px-2 py-1 rounded-sm overflow-hidden text-ellipsis whitespace-nowrap">
                    {releaseData.transactionHash}
                  </div>
                </div>
              )}
              
              {releaseData.transactionId && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs text-muted-foreground">Transaction ID</div>
                  <div className="font-mono text-xs bg-muted-foreground/10 px-2 py-1 rounded-sm">
                    {releaseData.transactionId}
                  </div>
                </div>
              )}
            </div>

            {releaseData.success ? (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1.5 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Transaction Complete</h3>
                    <p className="text-sm text-green-700/80 mt-1">
                      The local prototype recorded a notional release. No funds moved and no seller was paid.
                      {releaseData.transactionId && " The transaction is now recorded in your transaction history."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1.5 mt-0.5">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Transaction Issue</h3>
                    <p className="text-sm text-amber-700/80 mt-1">
                      There was an issue releasing the funds. Please try again or contact support for assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                onClick={() => onOpenChange(false)} 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
