import { useState, useEffect } from "react";
import { 
  FileCheck, 
  Link, 
  Loader2, 
  Shield, 
  CheckCircle,
  Boxes,
  ArrowLeftRight 
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
  contractAddress = "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
  type = "created",
  commodityName = "Commodity"
}: SmartContractModalProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Start the animation sequence when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setProgress(0);
      setIsComplete(false);
      
      const timer = setTimeout(() => {
        animateProcess();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Generate a transaction hash
  const getTxHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 16; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };
  
  // Simulate smart contract deployment or completion
  const animateProcess = () => {
    const steps = type === "created" ? 3 : 4;
    const stepDuration = 1500; // ms per step
    
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        setStep(i + 1);
        if (i === steps - 1) {
          setIsComplete(true);
        }
      }, i * stepDuration);
      
      // Animate progress bar
      const progressUpdateInterval = 50; // ms per progress update
      const updates = stepDuration / progressUpdateInterval;
      
      for (let j = 0; j < updates; j++) {
        setTimeout(() => {
          setProgress(prev => {
            const increment = (i * (100 / steps)) + (j * ((100 / steps) / updates));
            return Math.min(increment, 100);
          });
        }, i * stepDuration + j * progressUpdateInterval);
      }
    }
  };
  
  // Steps for contract creation and completion
  const creationSteps = [
    {
      icon: <Boxes className="h-8 w-8 text-blue-500" />,
      title: "Smart Contract Initialization",
      description: "Preparing escrow contract for your commodity exchange"
    },
    {
      icon: <Shield className="h-8 w-8 text-indigo-500" />,
      title: "Contract Deployment",
      description: "Deploying secure escrow smart contract to the blockchain"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "Contract Created",
      description: "Smart contract successfully deployed and ready for transactions"
    }
  ];
  
  const completionSteps = [
    {
      icon: <FileCheck className="h-8 w-8 text-blue-500" />,
      title: "Verification Process",
      description: "Confirming transaction details and party identities"
    },
    {
      icon: <ArrowLeftRight className="h-8 w-8 text-indigo-500" />,
      title: "Fund Transfer",
      description: "Processing secure transaction between parties"
    },
    {
      icon: <Link className="h-8 w-8 text-purple-500" />,
      title: "Blockchain Confirmation",
      description: "Recording transaction on the distributed ledger"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: "Transaction Complete",
      description: "Contract successfully executed and assets transferred"
    }
  ];
  
  const currentSteps = type === "created" ? creationSteps : completionSteps;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "created" 
              ? "Smart Contract Created" 
              : "Smart Contract Executed"}
          </DialogTitle>
          <DialogDescription>
            {type === "created"
              ? `Creating secure escrow smart contract for ${commodityName}`
              : `Finalizing transaction for ${commodityName} with blockchain security`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-full">
              <div className="flex justify-between mb-2 text-sm">
                <span>{type === "created" ? "Deployment Progress" : "Transaction Progress"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          
          {/* Transaction visualization */}
          <div className="mb-6 flex justify-center">
            <div className="h-24 w-24 rounded-lg bg-gradient-to-tr from-primary/10 to-primary/30 flex items-center justify-center relative overflow-hidden">
              {isComplete ? (
                <CheckCircle className="h-12 w-12 text-green-500 animate-pulse" />
              ) : (
                <Loader2 className="h-12 w-12 text-primary/70 animate-spin" />
              )}
              
              {/* Animated background effect */}
              <div className="absolute inset-0">
                <div className={`absolute top-0 left-0 w-full h-1 bg-primary/20 transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute bottom-0 right-0 w-full h-1 bg-primary/20 transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 right-0 w-1 h-full bg-primary/20 transition-all duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute bottom-0 left-0 w-1 h-full bg-primary/20 transition-all duration-500 ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
            </div>
          </div>
          
          {/* Contract details */}
          <div className="mb-6 space-y-3 text-xs">
            <div className="p-3 bg-muted rounded-lg font-mono">
              <div className="mb-1 text-muted-foreground">Contract Address:</div>
              <div className="text-primary">{contractAddress}</div>
            </div>
            
            {step >= 2 && (
              <div className="p-3 bg-muted rounded-lg font-mono">
                <div className="mb-1 text-muted-foreground">Transaction Hash:</div>
                <div className="text-primary">{getTxHash()}</div>
              </div>
            )}
          </div>
          
          {/* Process steps */}
          <div className="space-y-3">
            {currentSteps.map((s, i) => (
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
          
          {isComplete && (
            <div className="mt-6 rounded-lg bg-green-50 p-3 border border-green-200">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-800">
                    {type === "created" 
                      ? "Contract Ready" 
                      : "Transaction Successful"}
                  </h4>
                  <p className="text-xs text-green-700">
                    {type === "created" 
                      ? `Your escrow smart contract for ${commodityName} has been deployed to the blockchain. The contract is now ready to secure your transaction.`
                      : `The transaction for ${commodityName} has been successfully verified and recorded on the blockchain. All parties have been notified.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            disabled={!isComplete}
          >
            {isComplete ? "Continue" : "Processing..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}