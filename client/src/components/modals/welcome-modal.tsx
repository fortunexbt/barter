import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Confetti, ShieldCheck, ArrowRight } from "lucide-react";
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

export function WelcomeModal() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage("hasSeenWelcome", false);
  
  useEffect(() => {
    // Show the welcome modal only for new users who haven't seen it
    // and only if they're not already KYC verified
    if (user && !hasSeenWelcome && user.kycStatus !== "verified") {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenWelcome]);

  const handleBeginKYC = () => {
    setHasSeenWelcome(true);
    setIsOpen(false);
    // Navigate to the profile page, KYC section
    navigate("/profile");
    // The "#kyc" hash will be used by the profile page to open the KYC tab
    window.location.hash = "kyc";
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Confetti className="h-5 w-5 text-primary" />
            </div>
            <span>Welcome to BarterTrade!</span>
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            You're almost ready to start trading. Complete your KYC verification to unlock all platform features.
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