import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppShell from "@/components/layout/app-shell";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Loader2, Upload, Image as ImageIcon, ShieldCheck, Key,
  CheckCircle, AlertTriangle, Briefcase, MapPin, Calendar, 
  Award, CreditCard, Settings, Bell, Lock, PieChart,
  UserCircle, Clock, Truck, Box, BarChart2, FileText, Share2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { KycDocument } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KycVerificationForm } from "@/components/kyc/kyc-verification-form"; 
import ZkpVerificationModal from "@/components/modals/zkp-verification-modal";
import KycApprovalModal from "@/components/modals/kyc-approval-modal";
import { KycSuccessModal } from "@/components/modals/kyc-success-modal";

// Define form schemas
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  bio: z.string().max(250, "Bio should be less than 250 characters").optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Get tab from URL if available
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  
  // Set the active tab based on URL parameter or KYC status for new users
  const [activeTab, setActiveTab] = useState(() => {
    // If tab is specified in URL, use that value
    if (tabParam) return tabParam;
    
    // If user has pending KYC, default to KYC tab
    if (user?.kycStatus === "pending" || !user?.kycStatus) return "kyc";
    
    // Otherwise default to profile tab
    return "profile";
  });
  
  // State for modals
  const [isZkpModalOpen, setIsZkpModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Handle changes to the URL when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newSearchParams = new URLSearchParams(window.location.search);
    if (value === "profile") {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', value);
    }
    const newSearch = newSearchParams.toString();
    window.history.pushState(
      null, 
      '', 
      newSearch ? `?${newSearch}` : window.location.pathname
    );
  };
  
  // Form for profile editing
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName,
        email: user.email,
        role: user.role || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user, profileForm]);
  
  // Fetch KYC documents
  const { data: kycDocuments, isLoading: loadingKycDocuments } = useQuery({
    queryKey: ["/api/kyc/documents"],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiRequest("GET", "/api/kyc/documents");
      const data = await response.json();
      return data as KycDocument[];
    },
    enabled: !!user,
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });
  
  // Event listener for ZKP verification complete
  useEffect(() => {
    const handleZkpComplete = () => {
      console.log("ZKP verification completed");
      setIsZkpModalOpen(false);
      
      // Short delay before showing KYC approval modal
      setTimeout(() => {
        setIsKycModalOpen(true);
      }, 500);
    };
    
    window.addEventListener('zkp-verification-complete', handleZkpComplete);
    
    return () => {
      window.removeEventListener('zkp-verification-complete', handleZkpComplete);
    };
  }, []);
  
  // Event listener for KYC approval complete
  useEffect(() => {
    const handleKycApprovalComplete = () => {
      console.log("KYC approval completed");
      setIsKycModalOpen(false);
      
      // Short delay before showing success modal
      setTimeout(() => {
        setIsSuccessModalOpen(true);
      }, 500);
    };
    
    window.addEventListener('kyc-approval-complete', handleKycApprovalComplete);
    
    return () => {
      window.removeEventListener('kyc-approval-complete', handleKycApprovalComplete);
    };
  }, []);
  
  // Event listener for showing the platform tour after KYC success
  useEffect(() => {
    const handleKycSuccessComplete = () => {
      console.log("KYC success completed, preparing to show platform tour");
      // Store a flag in localStorage to indicate KYC is complete
      localStorage.setItem('identitySimulationComplete', 'true');
      
      // Force refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Close success modal
      setIsSuccessModalOpen(false);
      
      // Trigger platform tour (handled by the tour component)
      const tourEvent = new CustomEvent('start-platform-tour', { detail: { force: true } });
      window.dispatchEvent(tourEvent);
    };
    
    window.addEventListener('kyc-success-complete', handleKycSuccessComplete);
    
    return () => {
      window.removeEventListener('kyc-success-complete', handleKycSuccessComplete);
    };
  }, []);
  
  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle opening modals directly
  const handleShowZkpModal = () => {
    setIsZkpModalOpen(true);
  };
  
  // Handle KYC completion
  const handleKycComplete = (status: string) => {
    console.log(`KYC status updated to: ${status}`);
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };
  
  if (!user) {
    return (
      <AppShell>
        <div className="p-6">
          <Alert>
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to view your profile.
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <div className="container mx-auto py-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Account & Profile</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your account details and profile information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="trader">Commodity Trader</option>
                              <option value="producer">Producer</option>
                              <option value="broker">Broker</option>
                              <option value="logistics">Logistics Provider</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="profileImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image</FormLabel>
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {field.value ? (
                                <img 
                                  src={field.value} 
                                  alt="Profile" 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-8 w-8 opacity-50" />
                              )}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="h-10">
                              <Upload className="h-4 w-4 mr-2" />
                              Change Image
                            </Button>
                          </div>
                          <FormDescription>
                            This feature is simulated in the demo. URLs are accepted.
                          </FormDescription>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter image URL" 
                              className="mt-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-primary text-white"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kyc">
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Identity Flow Prototype</CardTitle>
                    <CardDescription>
                      Explore synthetic document and proof states; never submit real identity data
                    </CardDescription>
                  </div>
                  <div className={`py-1 px-3 rounded-full text-xs font-medium ${
                    user?.kycStatus === "verified" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {user?.kycStatus === "verified" ? "Demo state: complete" : "Demo state: pending"}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {user?.kycStatus === "verified" ? (
                  <div className="text-center py-8 space-y-5">
                    <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-green-600">Fixture State Complete</h3>
                      <p className="text-sm text-neutral-600 max-w-md mx-auto mt-2">
                        This account carries a completed prototype flag. It is not evidence of identity, KYC, eligibility, or counterparty trust.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-xs text-neutral-500">FIXTURE DATE</div>
                        <div className="font-medium">
                          {formatDate(new Date(), "Not available", {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="h-10 border-r"></div>
                      <div className="text-center">
                        <div className="text-xs text-neutral-500">ACCESS LEVEL</div>
                        <div className="font-medium">Premium</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <KycVerificationForm 
                        onComplete={handleKycComplete}
                        onShowZkpModal={handleShowZkpModal}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <div className="rounded-lg border p-4">
                        <h4 className="text-sm font-medium mb-2">Prototype States Exposed</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Agreement and notional-settlement simulations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Fixture trading-limit states</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Local challenge-response interface experiment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Legacy marketplace prototype screens</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* KYC Documents List */}
                      <div className="rounded-lg border p-4">
                        <h4 className="text-sm font-medium mb-3">Documents History</h4>
                        
                        {loadingKycDocuments ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          </div>
                        ) : kycDocuments && kycDocuments.length > 0 ? (
                          <div className="space-y-3">
                            {kycDocuments.map((document) => (
                              <div key={document.id} className="border rounded-md p-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-xs font-medium">
                                      {document.documentType.charAt(0).toUpperCase() + document.documentType.slice(1).replace('_', ' ')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                  <Badge variant={document.verified ? "success" : "outline"} className="text-xs">
                                    {document.verified ? "Demo complete" : "Demo pending"}
                                  </Badge>
                                </div>
                                
                                {!document.verified && (
                                  <p className="mt-2 text-[11px] text-muted-foreground">
                                    Fixture review is administrator-only.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-muted-foreground text-xs">
                            No documents submitted yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modals */}
      <ZkpVerificationModal 
        isOpen={isZkpModalOpen}
        onOpenChange={setIsZkpModalOpen}
      />
      
      <KycApprovalModal 
        isOpen={isKycModalOpen}
        onOpenChange={setIsKycModalOpen}
      />
      
      <KycSuccessModal 
        isOpen={isSuccessModalOpen}
        onOpenChange={setIsSuccessModalOpen}
      />
    </AppShell>
  );
}
