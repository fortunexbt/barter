import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "wouter";
import { CheckCircle } from "lucide-react";

interface KycApprovalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KycApprovalModal({ isOpen, onOpenChange }: KycApprovalModalProps) {
  const [, navigate] = useNavigate();

  const handleGenerateZkp = () => {
    onOpenChange(false);
    navigate("/profile?tab=kyc");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">KYC Verification Approved!</DialogTitle>
          <DialogDescription className="text-center">
            Your identity has been automatically verified for this demo experience
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            To enhance your privacy and security, we recommend generating a Zero-Knowledge Proof
            of your identity. This allows you to verify your identity without exposing personal details.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-800">
              Enhanced Privacy Protection
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Zero-Knowledge Proofs allow you to prove your identity is verified without revealing any
              personal information to your trading partners.
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:w-1/2"
          >
            Later
          </Button>
          <Button 
            onClick={handleGenerateZkp}
            className="sm:w-1/2 bg-gradient-to-r from-blue-600 to-blue-800"
          >
            Generate ZKP Identity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}