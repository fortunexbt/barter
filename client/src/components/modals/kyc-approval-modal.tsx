import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  ClipboardCheck, 
  FileText, 
  ShieldCheck, 
  Shield,
  User,
  Loader2
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface KycApprovalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KycApprovalModal({ isOpen, onOpenChange }: KycApprovalModalProps) {
  const { toast } = useToast();
  const [stage, setStage] = useState<"processing" | "approved" | "rejected">("processing");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      // Reset the state when the modal opens
      setStage("processing");
      setProgress(0);
      setStep(0);
      
      // Start the animation sequence
      const timer = setTimeout(() => {
        simulateKycVerification();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Simulate KYC verification process with a timed sequence
  const simulateKycVerification = () => {
    const stepDuration = 2000;
    const totalSteps = 4;
    
    // Animate through each step
    for (let i = 0; i < totalSteps; i++) {
      setTimeout(() => {
        setStep(i + 1);
        
        // Set final state at the end
        if (i === totalSteps - 1) {
          setStage("approved");
        }
      }, i * stepDuration);
      
      // Update progress bar more smoothly
      const progressUpdates = 40; // updates per step
      const progressUpdateInterval = stepDuration / progressUpdates;
      
      for (let j = 0; j < progressUpdates; j++) {
        setTimeout(() => {
          setProgress(prev => {
            const increment = ((i * 100 / totalSteps) + (j * (100 / totalSteps) / progressUpdates));
            return Math.min(increment, 100);
          });
        }, i * stepDuration + j * progressUpdateInterval);
      }
    }
  };
  
  const handleComplete = () => {
    if (stage === "approved") {
      toast({
        title: "Identity Simulation Complete",
        description: "The local fixture flow completed. No account, identity, or KYC status was verified.",
        variant: "default",
      });
      window.dispatchEvent(new CustomEvent('kyc-approval-complete', {
        detail: { simulated: true },
      }));
    }
    onOpenChange(false);
  };
  
  const verificationSteps = [
    {
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      title: "Fixture Intake",
      description: "Reading synthetic fields from the local prototype record"
    },
    {
      icon: <User className="h-8 w-8 text-indigo-500" />,
      title: "Fixture Identity Check",
      description: "Exercising the interface without external identity data sources"
    },
    {
      icon: <ClipboardCheck className="h-8 w-8 text-violet-500" />,
      title: "Policy Placeholder",
      description: "Showing where regulated provider and review results would appear"
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
      title: "Simulation Complete",
      description: "The fixture identity state has been updated"
    }
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Identity Status Simulation</DialogTitle>
          <DialogDescription>
            A timed interface demonstration using fixture data only
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-6">
            <div className="w-full">
              <div className="flex justify-between mb-2 text-sm">
                <span>Simulation Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          
          {/* Verification animation */}
          <div className="mb-6 flex justify-center">
            <div className="relative h-28 w-28 rounded-full bg-muted/30 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                {stage === "processing" ? (
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : stage === "approved" ? (
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-red-500" />
                  </div>
                )}
              </div>
              
              {/* Status badge */}
              <div className="absolute -bottom-2 -right-1">
                <Badge 
                  variant={stage === "approved" ? "default" : stage === "rejected" ? "destructive" : "outline"}
                  className="capitalize font-semibold"
                >
                  {stage}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Verification steps */}
          <div className="space-y-3">
            {verificationSteps.map((s, i) => (
              <div 
                key={i} 
                className={`flex items-start p-2 rounded-md transition-all duration-300 ${
                  i < step 
                    ? 'bg-muted/20 opacity-100' 
                    : i === step 
                      ? 'bg-muted/10 opacity-100 animate-pulse' 
                      : 'opacity-40'
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
                {i < step && (
                  <div className="ml-auto">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {stage === "approved" && (
            <div className="mt-6 rounded-lg bg-green-50 p-3 border border-green-200">
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Fixture State Updated</h4>
                  <p className="text-xs text-green-700">
                    The synthetic sequence reached its final UI state. It does not establish identity, compliance, account access, or transaction limits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleComplete}
            disabled={stage === "processing"}
            variant={stage === "approved" ? "default" : "outline"}
          >
            {stage === "processing" ? (
              "Processing..."
            ) : stage === "approved" ? (
              "Complete Simulation"
            ) : (
              "Close"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
