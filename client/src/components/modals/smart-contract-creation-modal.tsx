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
        description: `Escrow contract created with address ${data.contractAddress.substring(0, 8)}...`,
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === "create" && "Create Escrow Smart Contract"}
            {step === "processing" && "Creating Smart Contract..."}
            {step === "complete" && "Smart Contract Created"}
          </DialogTitle>
          <DialogDescription>
            {step === "create" && "Set up an escrow contract to securely handle the commodity transaction."}
            {step === "processing" && "Please wait while the contract is being deployed to the blockchain."}
            {step === "complete" && "Your escrow contract has been successfully deployed to the blockchain."}
          </DialogDescription>
        </DialogHeader>

        {step === "create" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="buyerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buyer ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!buyerId} />
                    </FormControl>
                    <FormDescription>
                      The ID of the buyer in this transaction.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commodityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commodity ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!commodityId} />
                    </FormControl>
                    <FormDescription>
                      The ID of the commodity being traded.
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
                    <FormLabel>Transaction Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormDescription>
                      The amount to be held in escrow for this transaction.
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
                <Button type="submit">Create Contract</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Creating your escrow contract on the blockchain...
              <br />
              This may take a few moments.
            </p>
          </div>
        )}

        {step === "complete" && contractData && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium">Contract Address:</dt>
                  <dd className="text-right font-mono">{`${contractData.contractAddress.substring(0, 6)}...${contractData.contractAddress.substring(contractData.contractAddress.length - 4)}`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction Hash:</dt>
                  <dd className="text-right font-mono">{`${contractData.transactionHash.substring(0, 6)}...${contractData.transactionHash.substring(contractData.transactionHash.length - 4)}`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Transaction ID:</dt>
                  <dd className="text-right">{contractData.transactionId}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-muted-foreground">
              Your escrow contract has been created. The buyer must now deposit funds
              to the escrow address before the transaction can proceed.
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