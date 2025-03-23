import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { Contract, InsertContract } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Filter, FileText, Plus, Search } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ContractModal from "@/components/modals/contract-modal";

const contractFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  buyerId: z.number().min(1, "Buyer is required"),
  commodityId: z.number().min(1, "Commodity is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  terms: z.string().min(1, "Terms are required"),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

export default function ContractsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewContractId, setViewContractId] = useState<number | null>(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: "",
      buyerId: 0,
      commodityId: 0,
      quantity: 0,
      price: 0,
      terms: "",
    },
  });
  
  const { data: contracts, isLoading, error } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/contracts");
      if (!response.ok) {
        throw new Error("Failed to fetch contracts");
      }
      return response.json();
    }
  });
  
  const createContractMutation = useMutation({
    mutationFn: async (contractData: InsertContract) => {
      const res = await apiRequest("POST", "/api/contracts", contractData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract created",
        description: "Your contract has been created successfully",
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ContractFormValues) => {
    const contractData: InsertContract = {
      ...data,
      sellerId: user!.id,
      status: "pending",
    };
    
    createContractMutation.mutate(contractData);
  };
  
  const handleViewContract = (contractId: number) => {
    setViewContractId(contractId);
    setContractModalOpen(true);
  };
  
  const getFilteredContracts = () => {
    if (!contracts) return [];
    
    return contracts.filter(contract => {
      const matchesSearch = 
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        contract.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };
  
  const filteredContracts = getFilteredContracts();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-success bg-opacity-10 text-success";
      case "pending":
        return "bg-warning bg-opacity-10 text-warning";
      case "completed":
        return "bg-info bg-opacity-10 text-info";
      case "cancelled":
        return "bg-error bg-opacity-10 text-error";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Smart Contracts</h2>
            <p className="text-neutral-500">Manage your trading and barter agreements</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
                  <DialogDescription>
                    Create a smart contract for your commodity trade.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Wheat Trade Agreement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buyerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buyer ID</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Buyer user ID" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
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
                              <Input 
                                type="number" 
                                placeholder="Commodity ID" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="e.g. 500" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="e.g. 1000.00" 
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter contract terms and conditions..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createContractMutation.isPending}
                        className="bg-primary text-white"
                      >
                        {createContractMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Contract"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contracts..."
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
                <DropdownMenuRadioItem value="signed">Signed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">Cancelled</DropdownMenuRadioItem>
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
            Failed to load contracts
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No contracts found matching your criteria
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-neutral-800">
                              {contract.title}
                            </h3>
                            <Badge variant="outline" className={getStatusColor(contract.status)}>
                              {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">
                            Contract #{contract.contractNumber}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex gap-2">
                          <Button 
                            onClick={() => handleViewContract(contract.id)}
                            size="sm" 
                            className="bg-primary text-white"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Parties</p>
                          <p className="font-medium text-neutral-600">
                            Seller: User #{contract.sellerId}
                          </p>
                          <p className="font-medium text-neutral-600">
                            Buyer: User #{contract.buyerId}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Commodity</p>
                          <p className="font-medium text-neutral-600">
                            ID: #{contract.commodityId}
                          </p>
                          <p className="font-medium text-neutral-600">
                            Quantity: {contract.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Value</p>
                          <p className="font-medium text-neutral-600">
                            ${contract.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-400">
                            Created: {new Date(contract.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <ContractModal 
        contractId={viewContractId} 
        isOpen={contractModalOpen} 
        onOpenChange={setContractModalOpen} 
      />
    </AppShell>
  );
}
