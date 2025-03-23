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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

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
}

export default function EscrowDepositModal({
  isOpen,
  onOpenChange,
  contractAddress = "",
  defaultAmount = "",
  onSuccess,
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

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormValues) => {
      setStep("processing");
      return apiRequest({
        method: "POST",
        url: "/api/smart-contracts/escrow/deposit",
        data: {
          contractAddress: data.contractAddress,
          amount: parseFloat(data.amount),
        },
      });
    },
    onSuccess: (data) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "create" && "Deposit Funds to Escrow"}
            {step === "processing" && "Processing Deposit..."}
            {step === "complete" && "Deposit Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "create" && "Deposit funds to the escrow contract to proceed with the transaction."}
            {step === "processing" && "Please wait while your deposit is being processed."}
            {step === "complete" && "Your funds have been successfully deposited to the escrow contract."}
          </DialogDescription>
        </DialogHeader>

        {step === "create" && (
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormDescription>
                      The amount to deposit into the escrow contract.
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
                <Button type="submit">Deposit Funds</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Processing your deposit transaction...
              <br />
              This may take a few moments.
            </p>
          </div>
        )}

        {step === "complete" && depositData && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction Status:</dt>
                  <dd className="text-right font-medium text-green-600">{depositData.success ? "Success" : "Failed"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction Hash:</dt>
                  <dd className="text-right font-mono">{`${depositData.transactionHash.substring(0, 6)}...${depositData.transactionHash.substring(depositData.transactionHash.length - 4)}`}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-muted-foreground">
              {depositData.success 
                ? "Your deposit has been processed and the funds are now securely held in the escrow contract. The seller will be notified to proceed with delivery."
                : "There was an issue with your deposit. Please try again or contact support for assistance."}
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