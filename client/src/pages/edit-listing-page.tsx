import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { 
  Package, 
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AppShell from "@/components/layout/app-shell";
import { Commodity } from "@shared/schema";
import { Link } from "wouter";

// Form schema for editing commodity listing
const commodityFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  grade: z.string().min(1, "Grade is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  priceUnit: z.string().min(1, "Price unit is required"),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  volumeUnit: z.string().min(1, "Volume unit is required"),
  status: z.string(),
  icon: z.string().optional().nullable(),
  iconBg: z.string().optional().nullable(),
});

type CommodityFormValues = z.infer<typeof commodityFormSchema>;

export default function EditListingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const commodityId = parseInt(id);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form setup with default values
  const form = useForm<CommodityFormValues>({
    resolver: zodResolver(commodityFormSchema),
    defaultValues: {
      name: "",
      grade: "",
      price: 0,
      priceUnit: "",
      volume: 0,
      volumeUnit: "",
      status: "available",
      icon: "",
      iconBg: ""
    },
  });
  
  // Fetch commodity data
  const { data: commodity, isLoading, error } = useQuery<Commodity>({
    queryKey: [`/api/commodities/${commodityId}`],
    queryFn: async () => {
      const response = await fetch(`/api/commodities/${commodityId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch commodity");
      }
      return response.json();
    },
    enabled: !isNaN(commodityId)
  });
  
  // Update form values when commodity data is loaded
  useEffect(() => {
    if (commodity) {
      form.reset({
        name: commodity.name,
        grade: commodity.grade,
        price: commodity.price,
        priceUnit: commodity.priceUnit,
        volume: commodity.volume,
        volumeUnit: commodity.volumeUnit,
        status: commodity.status || "available",
        icon: commodity.icon || "package",
        iconBg: commodity.iconBg || "blue"
      });
    }
  }, [commodity, form]);
  
  // Check if the user is authorized to edit this commodity
  const isAuthorized = commodity && user && commodity.ownerId === user.id;
  
  // Submit form data to update commodity
  const updateCommodityMutation = useMutation({
    mutationFn: async (commodityData: CommodityFormValues) => {
      const response = await apiRequest("PUT", `/api/commodities/${commodityId}`, commodityData);
      return await response.json();
    },
    onSuccess: (commodity) => {
      // Invalidate and refetch commodities query to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/commodities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/commodities/${commodityId}`] });
      
      setIsSuccess(true);
      
      toast({
        title: "Listing Updated Successfully",
        description: `Your ${commodity.name} has been updated in the marketplace.`,
        variant: "default",
      });
      
      // Redirect after a short delay to show success state
      setTimeout(() => {
        navigate("/marketplace/manage");
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Failed to update commodity:", error);
      toast({
        title: "Failed to update listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CommodityFormValues) => {
    updateCommodityMutation.mutate(data);
  };

  // Dropdown options
  const gradeOptions = ["Premium", "Grade A", "Standard", "Industrial"];
  const statusOptions = ["available", "bidding", "sold"];
  const priceUnitOptions = ["kg", "ton", "barrel", "oz", "unit"];
  const volumeUnitOptions = ["kg", "ton", "barrel", "oz", "unit"];
  const iconOptions = [
    { value: "package", label: "Package (Default)" },
    { value: "wheat", label: "Wheat/Agriculture" },
    { value: "gems", label: "Gems/Minerals" },
    { value: "droplet", label: "Water/Liquids" },
    { value: "fuel", label: "Energy/Fuel" },
    { value: "equipment", label: "Equipment/Machinery" },
  ];
  const colorOptions = [
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "amber", label: "Amber" },
    { value: "red", label: "Red" },
    { value: "slate", label: "Slate" },
    { value: "neutral", label: "Neutral" },
  ];
  
  // If we're still loading or there's an error, show appropriate UI
  if (isLoading) {
    return (
      <AppShell>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppShell>
    );
  }
  
  if (error || !commodity) {
    return (
      <AppShell>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Commodity Not Found</h2>
            <p className="text-neutral-500 mb-6">We couldn't find the commodity you're looking for.</p>
            <Button onClick={() => navigate("/marketplace/manage")}>
              Return to Manage Listings
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }
  
  if (!isAuthorized) {
    return (
      <AppShell>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Not Authorized</h2>
            <p className="text-neutral-500 mb-6">You don't have permission to edit this commodity.</p>
            <Button onClick={() => navigate("/marketplace")}>
              Return to Marketplace
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <Link href="/marketplace/manage">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manage Listings
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Edit Listing</h2>
            <p className="text-neutral-500">Update your commodity information</p>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {isSuccess ? (
            <Card className="border-success">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium">Listing Updated Successfully!</h3>
                  <p className="text-neutral-500">Your commodity has been updated in the marketplace</p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/marketplace/manage")}
                  >
                    Return to Manage Listings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit Commodity Details</CardTitle>
                <CardDescription>Update your commodity listing information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commodity Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Premium Coffee Beans" {...field} />
                            </FormControl>
                            <FormDescription>
                              Full descriptive name of your commodity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select grade" />
                                </SelectTrigger>
                                <SelectContent>
                                  {gradeOptions.map(grade => (
                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Quality grade of your commodity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0.01" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="priceUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Unit</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {priceUnitOptions.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Unit for the price (e.g., per kg)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <FormField
                          control={form.control}
                          name="volume"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Volume</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0.01" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="volumeUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume Unit</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {volumeUnitOptions.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Unit for the volume
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(status => (
                                    <SelectItem key={status} value={status}>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Current status of your listing
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commodity Icon</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value || "package"} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select icon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {iconOptions.map(icon => (
                                    <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="iconBg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon Color</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value || "blue"} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {colorOptions.map(color => (
                                    <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/marketplace/manage")}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={updateCommodityMutation.isPending}
                      >
                        {updateCommodityMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Listing"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <ShieldCheck className="h-6 w-6 text-primary/70" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-neutral-800">Listing Protection</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      All listings are protected by our smart contract escrow system, ensuring secure transactions 
                      between buyers and sellers. Commodities are verified and quality-checked by our platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}