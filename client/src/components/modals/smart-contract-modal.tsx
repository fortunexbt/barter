import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Database,
  Server,
  CircleCheck,
  Shield,
  Lock,
  Layers,
  ArrowLeftRight,
  CheckCircle,
  Wallet
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

interface SmartContractModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress?: string;
  type: "created" | "completed";
  commodityName?: string;
}

export default function SmartContractModal({ 
  isOpen, 
  onOpenChange, 
  contractAddress = "0x7a16ff8270133f063aab6c9977183d9e5e6e0037", 
  type = "created",
  commodityName = "Gold"
}: SmartContractModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Reset the animation whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnimationProgress(0);
      
      // Start the animation sequence
      const timer = setTimeout(() => {
        animateSteps();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Animate through the blockchain verification steps
  const animateSteps = () => {
    const stepDuration = 1300; // ms per step
    const steps = type === "created" ? 4 : 5;
    
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        setStep(i + 1);
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
  
  // Format contract address for display
  const formatContractAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Generate a transaction hash
  const getTransactionHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };
  
  const creationSteps = [
    {
      icon: <Database className="h-10 w-10 text-blue-500" />,
      title: "Contract Initialization",
      description: "Creating secure escrow contract terms"
    },
    {
      icon: <Shield className="h-10 w-10 text-indigo-500" />,
      title: "Security Verification",
      description: "Implementing contract security parameters"
    },
    {
      icon: <Server className="h-10 w-10 text-purple-500" />,
      title: "Blockchain Deployment",
      description: "Deploying contract to the blockchain network"
    },
    {
      icon: <CircleCheck className="h-10 w-10 text-green-500" />,
      title: "Contract Ready",
      description: "Smart contract successfully deployed"
    }
  ];
  
  const completionSteps = [
    {
      icon: <Lock className="h-10 w-10 text-blue-500" />,
      title: "Verification Initiated",
      description: "Verifying ownership and trade parameters"
    },
    {
      icon: <Wallet className="h-10 w-10 text-amber-500" />,
      title: "Fund Release",
      description: "Releasing funds from escrow for transaction"
    },
    {
      icon: <Layers className="h-10 w-10 text-indigo-500" />,
      title: "Block Confirmation",
      description: "Awaiting blockchain confirmations"
    },
    {
      icon: <ArrowLeftRight className="h-10 w-10 text-purple-500" />,
      title: "Ownership Transfer",
      description: "Transferring digital ownership records"
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-green-500" />,
      title: "Transaction Complete",
      description: "Trade successfully recorded on the blockchain"
    }
  ];
  
  const steps = type === "created" ? creationSteps : completionSteps;
  const transactionHash = getTransactionHash();
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "created" ? "Smart Contract Created" : "Trade Completion"}
          </DialogTitle>
          <DialogDescription>
            {type === "created" 
              ? "Escrow smart contract for secure commodity trading" 
              : "Blockchain verification of ownership transfer"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-full">
              <div className="flex justify-between mb-2 text-sm">
                <span>Transaction Progress</span>
                <span>{Math.round(animationProgress)}%</span>
              </div>
              <Progress value={animationProgress} className="h-2" />
            </div>
          </div>
          
          {/* Contract details */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="col-span-1 text-muted-foreground">Contract:</div>
              <div className="col-span-2 font-medium text-primary">
                {formatContractAddress(contractAddress)}
              </div>
              
              <div className="col-span-1 text-muted-foreground">Commodity:</div>
              <div className="col-span-2">{commodityName}</div>
              
              <div className="col-span-1 text-muted-foreground">Owner:</div>
              <div className="col-span-2">{user?.fullName || "Unknown"}</div>
              
              {type === "completed" && (
                <>
                  <div className="col-span-1 text-muted-foreground">Transaction:</div>
                  <div className="col-span-2 text-xs">{formatContractAddress(transactionHash)}</div>
                </>
              )}
            </div>
          </div>
          
          {/* Steps visualization */}
          <div className="space-y-4">
            {steps.map((s, i) => (
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
                <div className="mr-4 mt-0.5">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    i < step ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {s.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{s.title}</h4>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  
                  {i === step - 1 && i === steps.length - 1 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Complete
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            disabled={step < steps.length}
          >
            {step < steps.length ? "Processing..." : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}