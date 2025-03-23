import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Commodity } from "@shared/schema";
import AppShell from "@/components/layout/app-shell";
import { Link, useLocation } from "wouter";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Search,
  AlertTriangle,
  Package,
  Wheat,
  Droplets,
  Gem,
  Fuel,
  Tractor,
  Leaf,
  Banana
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch user's commodities
  const { data: commodities, isLoading, error } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities"],
    queryFn: async () => {
      const response = await fetch("/api/commodities");
      if (!response.ok) {
        throw new Error("Failed to fetch commodities");
      }
      return response.json();
    }
  });
  
  // Delete commodity mutation
  const deleteCommodityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/commodities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commodities"] });
      
      toast({
        title: "Listing Deleted",
        description: "Your commodity listing has been removed from the marketplace.",
      });
      
      setSelectedCommodityId(null);
    },
    onError: (error: Error) => {
      console.error("Failed to delete commodity:", error);
      toast({
        title: "Failed to delete listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter commodities owned by the current user
  const userCommodities = commodities?.filter(commodity => 
    commodity.ownerId === user?.id &&
    (searchTerm === "" || 
     commodity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     commodity.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedCommodityId !== null) {
      deleteCommodityMutation.mutate(selectedCommodityId);
    }
  };
  
  // Get icon component based on icon name
  const getCommodityIcon = (iconName: string | null) => {
    if (!iconName) return <Package className="h-4 w-4" />;
    
    switch (iconName.toLowerCase()) {
      case "agriculture":
      case "wheat":
        return <Wheat className="h-4 w-4" />;
      case "water":
      case "droplet":
        return <Droplets className="h-4 w-4" />;
      case "energy":
      case "fuel":
        return <Fuel className="h-4 w-4" />;
      case "fruits":
      case "food":
        return <Banana className="h-4 w-4" />;
      case "minerals":
      case "gems":
        return <Gem className="h-4 w-4" />;
      case "equipment":
        return <Tractor className="h-4 w-4" />;
      case "eco":
      case "organic":
        return <Leaf className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };
  
  // Format price with currency symbol
  const formatPrice = (price: number, unit: string) => {
    return `$${price.toLocaleString()} / ${unit}`;
  };
  
  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success bg-opacity-10 text-success";
      case "bidding":
        return "bg-info bg-opacity-10 text-info";
      case "sold":
        return "bg-neutral-200 text-neutral-500";
      default:
        return "bg-neutral-200 text-neutral-500";
    }
  };
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Manage Listings</h2>
            <p className="text-neutral-500">View and manage your commodity listings</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate("/marketplace")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Marketplace
            </Button>
            <Link href="/marketplace/new">
              <Button className="bg-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your listings..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Your Listings</CardTitle>
            <CardDescription>
              Manage the commodities you've listed on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-neutral-600">Failed to load your listings</p>
                <p className="text-neutral-500 text-sm mt-1">Please try again later</p>
              </div>
            ) : userCommodities.length === 0 ? (
              <div className="py-8 text-center border rounded-md">
                <Package className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">You don't have any listings yet</p>
                <p className="text-neutral-500 text-sm mt-1">Create a new listing to get started</p>
                <Link href="/marketplace/new">
                  <Button className="mt-4 bg-primary text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userCommodities.map((commodity) => (
                      <TableRow key={commodity.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 bg-${commodity.iconBg || "neutral"}-100 rounded-full flex items-center justify-center text-${commodity.iconBg || "neutral"}-600 mr-3`}>
                              {getCommodityIcon(commodity.icon)}
                            </div>
                            <div>
                              <div className="font-medium">{commodity.name}</div>
                              <div className="text-sm text-neutral-500">{commodity.grade}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatPrice(commodity.price, commodity.priceUnit)}
                        </TableCell>
                        <TableCell>
                          {commodity.volume} {commodity.volumeUnit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(commodity.status || "unknown")}>
                            {commodity.status 
                              ? commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1) 
                              : "Unknown"
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/marketplace/${commodity.id}`)}
                            >
                              <ArrowRight className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/marketplace/edit/${commodity.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive border-destructive/20"
                                  onClick={() => setSelectedCommodityId(commodity.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the listing from the marketplace.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground"
                                    onClick={handleDeleteConfirm}
                                  >
                                    {deleteCommodityMutation.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}