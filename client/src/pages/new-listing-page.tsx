import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Package, 
  Loader2,
  ArrowLeft,
  CheckCircle,
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
import { InsertCommodity } from "@shared/schema";
import { Link } from "wouter";

// Form schema for new commodity listing
const commodityFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  grade: z.string().min(1, "Grade is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  priceUnit: z.string().min(1, "Price unit is required"),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  volumeUnit: z.string().min(1, "Volume unit is required"),
  status: z.string().default("available"),
  icon: z.string().optional().nullable(),
  iconBg: z.string().optional().nullable(),
});

type CommodityFormValues = z.infer<typeof commodityFormSchema>;

export default function NewListingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<CommodityFormValues>({
    resolver: zodResolver(commodityFormSchema),
    defaultValues: {
      name: "",
      grade: "Standard",
      price: 0,
      priceUnit: "kg",
      volume: 0,
      volumeUnit: "kg",
      status: "available",
      icon: "package",
      iconBg: "blue"
    },
  });
  
  // Submit form data to create new commodity
  const createCommodityMutation = useMutation({
    mutationFn: async (commodityData: CommodityFormValues) => {
      const response = await apiRequest("POST", "/api/commodities", commodityData);
      return await response.json();
    },
    onSuccess: (commodity) => {
      // Invalidate and refetch commodities query to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/commodities"] });
      
      setIsSuccess(true);
      
      toast({
        title: "Listing Created Successfully",
        description: `Your ${commodity.name} has been added to the marketplace.`,
        variant: "default",
      });
      
      // Redirect after a short delay to show success state
      setTimeout(() => {
        navigate("/marketplace");
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Failed to create commodity:", error);
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CommodityFormValues) => {
    createCommodityMutation.mutate(data);
  };

  // Dropdown options
  const gradeOptions = ["Premium", "Grade A", "Standard", "Industrial"];
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
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <Link href="/marketplace">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-neutral-600">Create New Listing</h2>
            <p className="text-neutral-500">Add your commodity to the marketplace</p>
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
                  <h3 className="text-xl font-medium">Listing Created Successfully!</h3>
                  <p className="text-neutral-500">Your commodity has been added to the marketplace</p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/marketplace")}
                  >
                    Return to Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Commodity Details</CardTitle>
                <CardDescription>Enter your commodity listing information</CardDescription>
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
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                            <FormDescription>
                              Visual representation of your commodity
                            </FormDescription>
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
                            <FormDescription>
                              Background color for the icon
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/marketplace")}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        type="submit"
                        disabled={createCommodityMutation.isPending}
                      >
                        {createCommodityMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Listing"
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
                    <h3 className="text-base font-medium text-neutral-800">Prototype Safeguards</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      This prototype records listing and agreement states locally. It does not custody funds,
                      verify commodities, or replace independent inspection and legal due diligence.
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
