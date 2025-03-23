import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileImage, 
  Upload, 
  Shield, 
  CheckCircle, 
  Loader2,
  AlertTriangle,
  ArrowRight
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const kycFormSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(3, "Document number is required"),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

interface KycVerificationFormProps {
  onComplete?: (kycStatus: string) => void;
  onShowZkpModal: () => void;
  onShowKycModal: () => void;
}

export function KycVerificationForm({ onComplete, onShowZkpModal, onShowKycModal }: KycVerificationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      documentType: "",
      documentNumber: "",
    },
  });
  
  // Handle document upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };
  
  // Submit KYC document
  const submitKycMutation = useMutation({
    mutationFn: async (data: KycFormValues) => {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append("userId", user?.id.toString() ?? "");
      formData.append("documentType", data.documentType);
      formData.append("documentNumber", data.documentNumber);
      
      if (uploadedFile) {
        formData.append("document", uploadedFile);
      }
      
      const res = await apiRequest("POST", "/api/kyc/submit", formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      setStep(2);
      // Show ZKP verification modal after 500ms
      setTimeout(() => {
        onShowZkpModal();
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "KYC Submission Error",
        description: error.message || "There was an error submitting your KYC documents. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle ZKP verification completion
  const handleZkpComplete = () => {
    setStep(3);
    // Show KYC approval modal after 500ms
    setTimeout(() => {
      onShowKycModal();
    }, 500);
  };
  
  // Listen for KYC verification completion event from ZKP modal
  useEffect(() => {
    const handleKycVerificationComplete = () => {
      setStep(3);
      
      // Update user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (onComplete) {
        onComplete("verified");
      }
    };
    
    window.addEventListener('kycVerificationComplete', handleKycVerificationComplete);
    
    return () => {
      window.removeEventListener('kycVerificationComplete', handleKycVerificationComplete);
    };
  }, [onComplete]);
  
  // Handle KYC approval completion
  const handleKycApproved = () => {
    if (onComplete) {
      onComplete("verified");
    }
    
    // Show success toast
    toast({
      title: "KYC Verification Complete",
      description: "Your identity has been verified. You now have full access to all platform features.",
    });
  };
  
  const onSubmit = (data: KycFormValues) => {
    if (!uploadedFile) {
      toast({
        title: "Document Required",
        description: "Please upload an identification document to continue.",
        variant: "destructive",
      });
      return;
    }
    
    submitKycMutation.mutate(data);
  };
  
  // For demo purposes, advance to the next step directly
  const simulateKycSubmission = () => {
    if (!uploadedFile) {
      toast({
        title: "Document Required",
        description: "Please upload an identification document to continue.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "KYC Document Submitted",
      description: "Your document has been received. Proceeding to verification.",
    });
    
    setStep(2);
    setTimeout(() => {
      onShowZkpModal();
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Your Progress</span>
          <span>Step {step} of 3</span>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>
      
      {/* Step 1: Document Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium">KYC Verification</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your identification document and provide some basic information. Your data is secured using zero-knowledge proofs for privacy.
                </p>
              </div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Document Type */}
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="other">Other Government ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of identification document you'll be uploading
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Document Number */}
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter the ID number on your document" />
                    </FormControl>
                    <FormDescription>
                      This information will be kept secure and private
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="document-upload">Upload Document</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {uploadedFile ? (
                      <>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-sm font-medium">{uploadedFile.name}</div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(uploadedFile.size / 1024)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileImage className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-sm font-medium">Upload any document to simulate KYC</div>
                        <p className="text-xs text-muted-foreground">
                          Passport, ID, driver's license, etc.
                        </p>
                      </>
                    )}
                    
                    <Input
                      id="document-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => document.getElementById('document-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadedFile ? "Replace File" : "Select File"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  disabled={submitKycMutation.isPending}
                  onClick={() => simulateKycSubmission()}
                >
                  {submitKycMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Continue to Verification
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
      
      {/* Step 2: ZKP Generation */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-blue-50">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium">Zero-Knowledge Proof Generation</h4>
                <p className="text-sm text-blue-600/70 mt-1">
                  Your identity document is being processed. We're generating a cryptographic proof that verifies your identity without exposing your personal data.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="rounded-lg bg-muted p-4">
            <h5 className="text-sm font-medium mb-2">What is a Zero-Knowledge Proof?</h5>
            <p className="text-sm text-muted-foreground">
              Zero-knowledge proofs allow us to verify your identity without storing or sharing your personal information. This cryptographic technique enhances your privacy while maintaining trust between trading parties.
            </p>
          </div>
        </div>
      )}
      
      {/* Step 3: KYC Completion */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-green-50">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="h-10 w-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium">Verification Complete!</h4>
                <p className="text-sm text-green-600/70 mt-1">
                  Your identity has been verified using zero-knowledge proofs. You now have full access to all platform features.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-gradient-to-tr from-primary/5 to-primary/20 p-4">
            <h5 className="text-sm font-medium mb-2">You now have access to:</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Smart contract-based escrow services</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Higher trading limits and volume</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Zero-knowledge identity verification with counterparties</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Access to premium marketplace listings</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="button"
              onClick={() => {
                if (onComplete) {
                  onComplete("verified");
                }
              }}
            >
              Go to Marketplace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}