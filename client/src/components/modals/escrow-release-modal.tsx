import { useState } from "react";
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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      contractAddress,
      sellerId,
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (data: ReleaseFormValues) => {
      setStep("processing");
      return apiRequest({
        method: "POST",
        url: "/api/smart-contracts/escrow/release",
        data: {
          contractAddress: data.contractAddress,
          sellerId: parseInt(data.sellerId),
        },
      });
    },
    onSuccess: (data) => {
      setReleaseData(data);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      toast({
        title: "Funds Released",
        description: `Successfully released funds to the seller.`,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Releasing Funds",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "confirm" && "Release Escrow Funds"}
            {step === "processing" && "Processing Release..."}
            {step === "complete" && "Funds Released"}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" && "Confirm that you want to release funds from the escrow contract to the seller."}
            {step === "processing" && "Please wait while your request is being processed."}
            {step === "complete" && "The funds have been released to the seller."}
          </DialogDescription>
        </DialogHeader>

        {step === "confirm" && (
          <>
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                This action will release the escrowed funds to the seller.
                Only confirm if you have received the commodity as agreed.
                This action cannot be reversed.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contractAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Address</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!!contractAddress} />
                      </FormControl>
                      <FormDescription>
                        The blockchain address of the escrow contract.
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
                      <FormDescription>
                        The ID of the seller who will receive the funds.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="default">Confirm Release</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Processing your release transaction...
              <br />
              This may take a few moments.
            </p>
          </div>
        )}

        {step === "complete" && releaseData && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">Transaction Complete</h3>
            </div>

            <div className="rounded-md bg-muted p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction Status:</dt>
                  <dd className="text-right font-medium text-green-600">{releaseData.success ? "Success" : "Failed"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction Hash:</dt>
                  <dd className="text-right font-mono">{`${releaseData.transactionHash.substring(0, 6)}...${releaseData.transactionHash.substring(releaseData.transactionHash.length - 4)}`}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-muted-foreground">
              {releaseData.success 
                ? "The funds have been successfully released from escrow to the seller. This completes the transaction."
                : "There was an issue releasing the funds. Please try again or contact support for assistance."}
            </p>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}