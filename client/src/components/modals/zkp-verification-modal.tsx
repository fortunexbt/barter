import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Fingerprint,
  ShieldCheck,
  Key,
  BadgeCheck,
  Eye,
  EyeOff,
  Users
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

interface ZkpVerificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  counterpartyName?: string;
}

export default function ZkpVerificationModal({ 
  isOpen, 
  onOpenChange, 
  counterpartyName = "Trading Partner"
}: ZkpVerificationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  // Reset the animation whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnimationProgress(0);
      setIsVerified(false);
      
      // Start the animation sequence
      const timer = setTimeout(() => {
        animateVerification();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Animate through the ZKP verification steps
  const animateVerification = () => {
    const stepDuration = 1500; // ms per step
    const steps = 4;
    
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        setStep(i + 1);
        if (i === steps - 1) {
          setIsVerified(true);
        }
      }, i * stepDuration);
      
      // Animate progress bar
      const progressAnimationInterval = 50; // ms per progress update
      const progressSteps = stepDuration / progressAnimationInterval;
      
      for (let j = 0; j < progressSteps; j++) {
        setTimeout(() => {
          setAnimationProgress(prev => {
            const newProgress = (i * 100 / steps) + (j * (100 / steps) / progressSteps);
            return Math.min(newProgress, 100);
          });
        }, i * stepDuration + j * progressAnimationInterval);
      }
    }
  };
  
  // Generate a ZKP proof hash for display
  const getProofHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 16; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };
  
  const verificationSteps = [
    {
      icon: <Fingerprint className="h-10 w-10 text-blue-500" />,
      title: "Identity Challenge",
      description: "Creating zero-knowledge identity challenge"
    },
    {
      icon: <Key className="h-10 w-10 text-indigo-500" />,
      title: "Generating Proof",
      description: "Computing cryptographic proof"
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-purple-500" />,
      title: "Verification",
      description: "Verifying counterparty identity without revealing data"
    },
    {
      icon: <BadgeCheck className="h-10 w-10 text-green-500" />,
      title: "Verification Complete",
      description: "Identity verified with ZKP cryptography"
    }
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zero-Knowledge Verification</DialogTitle>
          <DialogDescription>
            Verify counterparty identity without revealing sensitive information
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-full">
              <div className="flex justify-between mb-2 text-sm">
                <span>Verification Progress</span>
                <span>{Math.round(animationProgress)}%</span>
              </div>
              <Progress value={animationProgress} className="h-2" />
            </div>
          </div>
          
          {/* Verification visualization */}
          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className={`h-20 w-20 rounded-full ${isVerified ? 'bg-green-100' : 'bg-blue-100'} flex items-center justify-center transition-all duration-500`}>
                    {isVerified ? (
                      <BadgeCheck className="h-10 w-10 text-green-600" />
                    ) : (
                      <Users className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* User avatar */}
              <div className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-gray-100 border-2 border-white shadow-md flex items-center justify-center">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.fullName || "User"} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium rounded-full bg-gray-200">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              {/* Counterparty avatar */}
              <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-gray-100 border-2 border-white shadow-md flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-medium rounded-full bg-gray-200">
                  {counterpartyName.charAt(0)}
                </div>
              </div>
              
              {/* ZKP visual effect */}
              <div className="absolute inset-0 rounded-full">
                <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="animate-ping absolute inset-0 rounded-full bg-primary/20 animate-[ping_4s_ease-out_infinite]"></div>
                </div>
                <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="animate-ping absolute inset-0 rounded-full bg-primary/10 animate-[ping_3s_ease-out_infinite]"></div>
                </div>
              </div>
              
              {/* Privacy indicator */}
              <div className={`absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow flex items-center justify-center transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                {step >= 3 ? (
                  <EyeOff className="h-5 w-5 text-green-600" />
                ) : (
                  <Eye className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
          
          {/* Proof details */}
          {step >= 2 && (
            <div className="mb-6 p-3 bg-muted rounded-lg text-xs font-mono transition-all duration-300">
              <div className="mb-1 text-muted-foreground">Proof hash:</div>
              <div className="text-primary">{getProofHash()}</div>
            </div>
          )}
          
          {/* Steps visualization */}
          <div className="space-y-3">
            {verificationSteps.map((s, i) => (
              <div 
                key={i} 
                className={`flex items-start transition-all duration-300 ${
                  i < step 
                    ? 'opacity-100' 
                    : i === step 
                      ? 'opacity-100 animate-pulse' 
                      : 'opacity-30'
                }`}
              >
                <div className="mr-3 mt-0.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    i < step ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {s.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{s.title}</h4>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {isVerified && (
            <div className="mt-6 rounded-lg bg-green-50 p-3 border border-green-200">
              <div className="flex items-start">
                <BadgeCheck className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Verified Trading Partner</h4>
                  <p className="text-xs text-green-700">
                    The identity of {counterpartyName} has been verified using zero-knowledge proofs.
                    You can now safely proceed with the transaction.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            disabled={!isVerified}
          >
            {isVerified ? "Continue" : "Verifying..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}