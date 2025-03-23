import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileCheck, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
  contractAddress = "0x7a2F8e654B8958B48395C3b5FcC4153Ba2b602Fc", 
  type,
  commodityName = "Premium Coffee Beans"
}: SmartContractModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getDisplayAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            {type === "created" ? (
              <FileCheck className="h-6 w-6 text-blue-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {type === "created" 
              ? "Smart Contract Created" 
              : "Transaction Complete"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {type === "created"
              ? `Your escrow contract for ${commodityName} has been created`
              : `Your transaction for ${commodityName} has been finalized`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md border p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Contract Address</span>
              <Badge variant="outline" className="font-mono text-xs">
                {getDisplayAddress(contractAddress)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Network</span>
              <span className="text-sm">Ethereum Sepolia Testnet</span>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium">Status</span>
              {type === "created" ? (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600">Pending</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Completed</span>
                </div>
              )}
            </div>
          </div>
          
          {showDetails && (
            <div className="rounded-md border p-4 mt-4 bg-gray-50">
              <h4 className="text-sm font-semibold mb-2">Contract Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Contract Created</p>
                    <p className="text-xs text-muted-foreground">Today, {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {type === "completed" && (
                  <>
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Funds Deposited to Escrow</p>
                        <p className="text-xs text-muted-foreground">Today, {new Date(Date.now() - 300000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Delivery Confirmed</p>
                        <p className="text-xs text-muted-foreground">Today, {new Date(Date.now() - 120000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Funds Released</p>
                        <p className="text-xs text-muted-foreground">Today, {new Date(Date.now() - 60000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          <Button 
            variant="link" 
            className="p-0 h-auto mt-2 text-sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
        </div>
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            {type === "created" ? "Continue" : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}