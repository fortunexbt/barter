import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { KycDocument } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileCheck,
  LockKeyhole
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface KycApprovalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KycApprovalModal({ isOpen, onOpenChange }: KycApprovalModalProps) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [verificationProgress, setVerificationProgress] = useState(0);
  
  const { data: kycDocuments = [] } = useQuery<KycDocument[]>({
    queryKey: ['/api/kyc/documents'],
    enabled: !!user && isOpen,
  });
  
  // Most recent KYC document
  const latestDocument = kycDocuments.length > 0 
    ? kycDocuments.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      })[0]
    : null;
  
  const verificationStatus = latestDocument?.verified 
    ? "verified" 
    : latestDocument?.zkpVerified 
      ? "processing" 
      : "pending";
  
  // Simulate verification progress when modal is open
  useState(() => {
    if (isOpen && verificationStatus === "processing" && verificationProgress < 100) {
      const timer = setTimeout(() => {
        if (verificationProgress < 95) {
          setVerificationProgress(prev => prev + Math.random() * 10);
        } else {
          setVerificationProgress(100);
          // Automatically mark as verified when progress reaches 100%
          if (latestDocument && !latestDocument.verified) {
            verifyDocumentMutation.mutate(latestDocument.id);
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  });
  
  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("PATCH", `/api/kyc/documents/${documentId}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kyc/documents'] });
      toast({
        title: "Verification Complete",
        description: "Your identity has been successfully verified.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleContinue = () => {
    onOpenChange(false);
    if (verificationStatus === "verified") {
      navigate("/marketplace");
    }
  };
  
  // Render verification status content based on the current status
  const renderVerificationStatusContent = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-6 h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Successful</h3>
            <p className="text-gray-500 text-center mb-6">
              Your identity has been verified. You now have full access to the BarterTrade platform.
            </p>
            <div className="w-full max-w-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Identity Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileCheck className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Document Validated</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LockKeyhole className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Zero-Knowledge Proof Generated</span>
              </div>
            </div>
          </div>
        );
        
      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-6 h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification in Progress</h3>
            <p className="text-gray-500 text-center mb-6">
              We're processing your verification using zero-knowledge proofs. This usually takes less than a minute.
            </p>
            <div className="w-full max-w-sm mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>Verifying identity</span>
                <span>{Math.round(verificationProgress)}%</span>
              </div>
              <Progress value={verificationProgress} className="h-2" />
            </div>
            <div className="w-full max-w-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className={`h-4 w-4 ${verificationProgress > 30 ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-gray-700">Identity Check</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileCheck className={`h-4 w-4 ${verificationProgress > 60 ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-gray-700">Document Validation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LockKeyhole className={`h-4 w-4 ${verificationProgress > 90 ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-gray-700">ZKP Generation</span>
              </div>
            </div>
          </div>
        );
        
      case "pending":
      default:
        return (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-6 h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h3>
            <p className="text-gray-500 text-center mb-6">
              To access all features, please complete the KYC verification process in your profile.
            </p>
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate("/profile");
              }}
              className="w-full max-w-xs"
            >
              Complete Verification
            </Button>
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Secure access to trading with zero-knowledge proof verification
          </DialogDescription>
        </DialogHeader>
        
        {renderVerificationStatusContent()}
        
        <DialogFooter>
          <Button 
            onClick={handleContinue}
            variant={verificationStatus === "verified" ? "default" : "outline"}
          >
            {verificationStatus === "verified" ? "Continue to Trading" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}