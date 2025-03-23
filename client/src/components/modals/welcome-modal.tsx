import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PartyPopper, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface WelcomeModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function WelcomeModal({ forceOpen = false, onClose }: WelcomeModalProps) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Initialize as false to prevent flash on auth page
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage("hasSeenWelcome", false);
  
  useEffect(() => {
    // Only set the modal to open if:
    // 1. It's explicitly forced open through props, OR
    // 2. There's a logged-in user who hasn't seen the welcome message
    if (forceOpen) {
      setIsOpen(true);
    } else if (user && !hasSeenWelcome) {
      // Slight delay to show the modal after user has logged in
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenWelcome, forceOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  const handleBeginKYC = () => {
    setHasSeenWelcome(true);
    setIsOpen(false);
    // Navigate to the profile page, KYC section
    navigate("/profile?tab=kyc");
    if (onClose) onClose();
  };

  // Don't render anything if there's no user
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-primary" />
            </div>
            <span>👋 Welcome to BarterTrade!</span>
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            To start trading, please complete your KYC verification.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Why verify your identity?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  KYC verification increases trust between trading parties and unlocks premium features like smart contracts and escrow services.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-gradient-to-tr from-primary/5 to-primary/20 p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <span>Upload identification document</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <span>Generate secure zero-knowledge proof</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <span>Start trading with full platform access</span>
              </li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            onClick={handleBeginKYC}
          >
            Begin KYC Process
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}