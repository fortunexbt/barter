import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ZkpVerificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  counterpartyName?: string;
}

export default function ZkpVerificationModal({ 
  isOpen, 
  onOpenChange, 
  counterpartyName = "Sarah Johnson"
}: ZkpVerificationModalProps) {
  const [verificationStep, setVerificationStep] = useState<"initial" | "verifying" | "verified">("initial");
  
  const handleVerify = () => {
    setVerificationStep("verifying");
    // Simulate verification process
    setTimeout(() => {
      setVerificationStep("verified");
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 mb-4">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            {verificationStep === "initial" && "Verify Counterparty Identity"}
            {verificationStep === "verifying" && "Verifying Identity..."}
            {verificationStep === "verified" && "Identity Verified"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {verificationStep === "initial" && `Verify ${counterpartyName}'s identity using Zero-Knowledge Proof`}
            {verificationStep === "verifying" && "Processing zero-knowledge proofs..."}
            {verificationStep === "verified" && `${counterpartyName}'s identity has been verified without exposing personal data`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {verificationStep === "initial" && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-md">
                <h4 className="text-sm font-medium text-amber-800">Privacy-Preserving Verification</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Zero-Knowledge Proofs allow you to verify the counterparty's identity is legitimate
                  without exposing any of their personal information.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Trading Partner</span>
                  <span className="text-sm">{counterpartyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Method</span>
                  <span className="text-sm">ZKP Protocol</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Data Shared</span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">None</Badge>
                </div>
              </div>
            </div>
          )}
          
          {verificationStep === "verifying" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
              <p className="text-sm text-muted-foreground">Validating ZKP with privacy-preserving algorithm...</p>
            </div>
          )}
          
          {verificationStep === "verified" && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="text-sm font-medium text-green-800">Identity Verified Successfully</h4>
                </div>
                <p className="text-xs text-green-700 mt-1 ml-7">
                  The counterparty's identity has been cryptographically verified through secure ZKP.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Trading Partner</span>
                  <span className="text-sm">{counterpartyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">KYC Status</span>
                  <Badge className="text-xs bg-green-100 text-green-800 border-0">Verified</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Verification Time</span>
                  <span className="text-xs text-muted-foreground">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {verificationStep === "initial" && (
            <Button 
              onClick={handleVerify} 
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800"
            >
              Verify Identity with ZKP
            </Button>
          )}
          
          {verificationStep === "verifying" && (
            <Button 
              disabled
              className="w-full"
            >
              Verifying...
            </Button>
          )}
          
          {verificationStep === "verified" && (
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Proceed with Transaction
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}