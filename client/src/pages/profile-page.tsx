import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Loader2, Upload, Check, Image as ImageIcon, ShieldCheck, Key } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KycDocument } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KycVerificationForm } from "@/components/kyc/kyc-verification-form"; 
import ZkpVerificationModal from "@/components/modals/zkp-verification-modal";
import KycApprovalModal from "@/components/modals/kyc-approval-modal";
import { KycSuccessModal } from "@/components/modals/kyc-success-modal";

const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  role: z.string().min(1, "Role is required"),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const kycFormSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(1, "Document number is required"),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

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
  
  // Form for KYC verification
  const kycForm = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      documentType: "",
      documentNumber: "",
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
  
  // Submit KYC document mutation
  const submitKycMutation = useMutation({
    mutationFn: async (kycData: KycFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await apiRequest("POST", "/api/kyc/submit", {
        userId: user.id,
        ...kycData,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      toast({
        title: "Documents Submitted",
        description: "Your KYC documents have been submitted for verification.",
      });
      // Open ZKP verification modal
      setIsZkpModalOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your KYC documents.",
        variant: "destructive",
      });
    },
  });
  
  // Verify KYC document mutation
  const verifyKycMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest("POST", `/api/kyc/verify/${documentId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Document Verified",
        description: "Your document has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "There was an error verifying the document.",
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
      localStorage.setItem('kycVerified', 'true');
      
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
  
  const onKycSubmit = (data: KycFormValues) => {
    submitKycMutation.mutate(data);
  };
  
  // Handle opening modals directly
  const handleShowZkpModal = () => {
    setIsZkpModalOpen(true);
  };
  
  const handleShowKycModal = () => {
    setIsKycModalOpen(true);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Identity Verification</CardTitle>
                    <CardDescription>
                      Verify your identity to unlock full platform features.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user?.kycStatus === "verified" ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <ShieldCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-green-600">Verification Complete</h3>
                        <p className="text-sm text-neutral-600">
                          Your identity has been verified successfully. You have access to all platform features.
                        </p>
                      </div>
                    ) : (
                      <KycVerificationForm 
                        onComplete={handleKycComplete}
                        onShowZkpModal={handleShowZkpModal}
                        onShowKycModal={handleShowKycModal}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>
                      Documents submitted for verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-3 rounded-md mb-4 ${
                      user?.kycStatus === "verified" 
                        ? "bg-success bg-opacity-10" 
                        : "bg-warning bg-opacity-10"
                    }`}>
                      <div className="flex items-center">
                        {user?.kycStatus === "verified" ? 
                          <ShieldCheck className="h-4 w-4 mr-2 text-success" /> : 
                          <Key className="h-4 w-4 mr-2 text-warning" />
                        }
                        <div>
                          <h4 className="text-xs font-medium text-neutral-500">Overall KYC STATUS</h4>
                          <p className={`text-sm font-medium ${
                            user?.kycStatus === "verified" ? "text-success" : "text-warning"
                          }`}>
                            {user?.kycStatus === "verified" ? "Verified" : "Pending Verification"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {loadingKycDocuments ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
                      </div>
                    ) : !kycDocuments || kycDocuments.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        No documents submitted yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {kycDocuments.map((document) => (
                          <div key={document.id} className="border border-neutral-200 rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">
                                  {document.documentType.charAt(0).toUpperCase() + document.documentType.slice(1).replace('_', ' ')}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  ID: {document.documentNumber}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  Submitted: {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <Badge variant="outline" className={`${
                                document.verified 
                                  ? "bg-success bg-opacity-10 text-success" 
                                  : "bg-warning bg-opacity-10 text-warning"
                              }`}>
                                {document.verified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                            
                            {/* Demo purpose only: button to simulate verification */}
                            {!document.verified && (
                              <Button 
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => verifyKycMutation.mutate(document.id)}
                                disabled={verifyKycMutation.isPending}
                              >
                                {verifyKycMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Simulate Verification
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
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