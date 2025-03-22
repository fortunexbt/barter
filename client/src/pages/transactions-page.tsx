import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Filter, FileDown } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function TransactionsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    }
  });
  
  const handleExportTransactions = () => {
    toast({
      title: "Export started",
      description: "Your transaction history is being prepared for download",
    });
    // In a real app, this would trigger a download of the transactions in CSV or PDF format
  };
  
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.id.toString().includes(searchTerm) ||
        transaction.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        transaction.status === statusFilter;
      
      const matchesType =
        transactionType === "all" ||
        transaction.type === transactionType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  };
  
  const filteredTransactions = getFilteredTransactions();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success bg-opacity-10 text-success";
      case "pending":
        return "bg-warning bg-opacity-10 text-warning";
      case "failed":
        return "bg-error bg-opacity-10 text-error";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trade":
        return "attach_money";
      case "barter":
        return "swap_horiz";
      default:
        return "receipt";
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "trade":
        return "text-primary";
      case "barter":
        return "text-secondary";
      default:
        return "text-neutral-500";
    }
  };

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Transaction History</h2>
            <p className="text-neutral-500">View your past trades and barter exchanges</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportTransactions}
            >
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setTransactionType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="trade">Trades</TabsTrigger>
            <TabsTrigger value="barter">Barters</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-neutral-400 text-sm">search</span>
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
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="failed">Failed</DropdownMenuRadioItem>
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
            Failed to load transactions
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No transactions found matching your criteria
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-10 h-10 bg-${
                      transaction.type === 'trade' ? 'primary' : 'secondary'
                    } bg-opacity-10 rounded-full flex items-center justify-center`}>
                      <span className={`material-icons ${getTypeColor(transaction.type)}`}>
                        {getTypeIcon(transaction.type)}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-neutral-800">
                              Transaction #{transaction.id}
                            </h3>
                            <Badge variant="outline" className={getStatusColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} transaction
                            {transaction.commodityId ? ` • Commodity #${transaction.commodityId}` : ''}
                            {transaction.barterId ? ` • Barter #${transaction.barterId}` : ''}
                            {transaction.contractId ? ` • Contract #${transaction.contractId}` : ''}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:text-right">
                          <p className="text-sm text-neutral-600">
                            {transaction.amount ? `$${transaction.amount.toLocaleString()}` : 'Barter exchange'}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
                        <div>
                          <span className="text-neutral-500">From:</span> User #{transaction.senderId}
                        </div>
                        <div>
                          <span className="text-neutral-500">To:</span> User #{transaction.receiverId}
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
    </AppShell>
  );
}
