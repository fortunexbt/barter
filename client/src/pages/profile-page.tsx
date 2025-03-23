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
import { ZkpVerificationModal } from "@/components/modals/zkp-verification-modal";
import { KycApprovalModal } from "@/components/modals/kyc-approval-modal";
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
  const [activeTab, setActiveTab] = useState("profile");
  
  // State for modals
  const [isZkpModalOpen, setIsZkpModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "",
      profileImage: user?.profileImage || "",
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // KYC form setup
  const kycForm = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      documentType: "",
      documentNumber: "",
    },
  });
  
  // Fetch KYC documents
  const { data: kycDocuments, isLoading: loadingKycDocuments } = useQuery<KycDocument[]>({
    queryKey: ["/api/kyc/documents"],
    queryFn: async () => {
      const response = await fetch("/api/kyc/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch KYC documents");
      }
      return response.json();
    }
  });
  
  // Submit KYC document mutation
  const submitKycMutation = useMutation({
    mutationFn: async (kycData: KycFormValues) => {
      const res = await apiRequest("POST", "/api/kyc/documents", kycData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "KYC document submitted",
        description: "Your document has been submitted for verification",
      });
      kycForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit KYC document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Demo purpose only: Auto-verify KYC document
  const verifyKycMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const res = await apiRequest("PUT", `/api/kyc/documents/${documentId}/verify`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "KYC document verified",
        description: "Your document has been verified successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to verify document",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // ZKP identity generation and verification
  const generateZkpIdentityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/kyc/generate-identity");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Zero-Knowledge Identity Created",
        description: "Your private identity has been generated and securely stored",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ZKP identity",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onKycSubmit = (data: KycFormValues) => {
    submitKycMutation.mutate(data);
  };

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Profile & KYC</h2>
          <p className="text-neutral-500">Manage your profile and verify your identity</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
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
                                <Input placeholder="John Doe" {...field} />
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
                                <Input type="email" placeholder="john@example.com" {...field} />
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
                                <Input placeholder="Commodity Trader" {...field} />
                              </FormControl>
                              <FormDescription>
                                Your role in the trading ecosystem
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="profileImage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter a URL for your profile image
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Preview</CardTitle>
                    <CardDescription>
                      How others see your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full mb-4 overflow-hidden bg-neutral-200 flex items-center justify-center">
                      {profileForm.watch("profileImage") ? (
                        <img 
                          src={profileForm.watch("profileImage")} 
                          alt={profileForm.watch("fullName")} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-neutral-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-700">
                      {profileForm.watch("fullName") || "Your Name"}
                    </h3>
                    <p className="text-neutral-500">
                      {profileForm.watch("role") || "Your Role"}
                    </p>
                    <div className="mt-4">
                      <Badge variant="outline" className={`${
                        user?.kycStatus === "verified" 
                          ? "bg-success bg-opacity-10 text-success" 
                          : "bg-warning bg-opacity-10 text-warning"
                      }`}>
                        <span className="material-icons text-xs mr-1">
                          {user?.kycStatus === "verified" ? "verified" : "pending"}
                        </span>
                        {user?.kycStatus === "verified" ? "Verified" : "Pending Verification"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="w-full pt-4 border-t border-neutral-200">
                      <p className="text-sm text-neutral-500">Account Level</p>
                      <p className="font-medium">{user?.accountLevel || "Standard"}</p>
                    </div>
                    <div className="w-full pt-4">
                      <p className="text-sm text-neutral-500">Trading Since</p>
                      <p className="font-medium">
                        {user?.tradingSince 
                          ? new Date(user.tradingSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                          : "June 2022"}
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="kyc">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>KYC Verification</CardTitle>
                    <CardDescription>
                      Submit your documents for verification to access all platform features
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center">
                        <span className="material-icons mr-2 text-info">info</span>
                        Why KYC is Required
                      </h4>
                      <p className="text-sm text-neutral-600">
                        Know Your Customer (KYC) verification is required for regulatory compliance and to ensure 
                        secure trading. Verified accounts have access to higher transaction limits and additional features.
                      </p>
                    </div>
                    
                    <Alert className="mb-6 border-primary/20 bg-primary/5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary font-medium">Enhanced Privacy with Zero-Knowledge Proofs</AlertTitle>
                      <AlertDescription className="text-sm text-neutral-600">
                        Our platform uses zero-knowledge proof technology to verify your identity without exposing your personal data.
                        This cryptographic approach ensures your privacy while maintaining regulatory compliance.
                      </AlertDescription>
                    </Alert>

                    {user?.zkpVerified ? (
                      <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-md flex items-center">
                        <Check className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-success mb-1">Zero-Knowledge Verification Complete</h4>
                          <p className="text-sm text-neutral-600">
                            Your identity has been verified using zero-knowledge proofs. You have full access to all platform features.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 border rounded-md overflow-hidden">
                        <div className="bg-neutral-50 p-4 border-b">
                          <h4 className="font-medium mb-1 flex items-center">
                            <Key className="h-4 w-4 mr-2 text-primary" />
                            Zero-Knowledge Verification
                          </h4>
                          <p className="text-sm text-neutral-600">
                            Complete this step to verify your identity with enhanced privacy protection
                          </p>
                        </div>
                        <div className="p-4">
                          <Button 
                            type="button"
                            className="bg-primary text-white"
                            onClick={() => generateZkpIdentityMutation.mutate()}
                            disabled={generateZkpIdentityMutation.isPending}
                          >
                            {generateZkpIdentityMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate Private Identity"
                            )}
                          </Button>
                          <p className="text-xs text-neutral-500 mt-2">
                            This creates a cryptographic identity that protects your personal information
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <Form {...kycForm}>
                      <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-4">
                        <FormField
                          control={kycForm.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Type</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                >
                                  <option value="">Select document type</option>
                                  <option value="passport">Passport</option>
                                  <option value="id">National ID</option>
                                  <option value="driving_license">Driving License</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={kycForm.control}
                          name="documentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter document ID number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="border-t border-neutral-200 pt-4 mb-4">
                          <p className="text-sm font-medium mb-2">Upload Document Image</p>
                          <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 flex flex-col items-center justify-center">
                            <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                            <p className="text-sm text-neutral-600 mb-1">Drag and drop your document, or click to browse</p>
                            <p className="text-xs text-neutral-400">Supports JPEG, PNG, PDF (Max 5MB)</p>
                            <Button type="button" variant="outline" className="mt-4">
                              Select File
                            </Button>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">
                            Note: Document upload feature is simulated for demo purposes
                          </p>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="bg-primary text-white"
                          disabled={submitKycMutation.isPending}
                        >
                          {submitKycMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit for Verification"
                          )}
                        </Button>
                      </form>
                    </Form>
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
                        <span className={`material-icons mr-2 ${
                          user?.kycStatus === "verified" ? "text-success" : "text-warning"
                        }`}>
                          {user?.kycStatus === "verified" ? "verified_user" : "pending"}
                        </span>
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
    </AppShell>
  );
}
