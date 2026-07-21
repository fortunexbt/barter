import { useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  ArrowRightLeft,
  ChevronRight,
  Check,
  PartyPopper
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

interface KycSuccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KycSuccessModal({ isOpen, onOpenChange }: KycSuccessModalProps) {
  const [_, navigate] = useLocation();
  
  // Background confetti effect
  useEffect(() => {
    if (!isOpen) return;
    
    // Simple confetti using canvas (could be replaced with a library in production)
    const createConfetti = () => {
      const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Configure particles
      const particles: any[] = [];
      const particleCount = 150;
      const colors = ['#4F46E5', '#3B82F6', '#06B6D4', '#10B981', '#A855F7'];
      
      // Create particles
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 10 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 3 + 1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2
        });
      }
      
      // Animation loop
      let animationFrame: number;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.y += p.speed;
          p.rotation += p.rotationSpeed;
          
          // Reset if particle goes below canvas
          if (p.y > canvas.height) {
            particles[i].y = -20;
          }
          
          // Draw particle
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
        
        animationFrame = requestAnimationFrame(animate);
      };
      
      animate();
      
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    };
    
    const cleanup = createConfetti();
    
    // Clean up
    return () => {
      if (cleanup) cleanup();
    };
  }, [isOpen]);
  
  const handleGoToMarketplace = () => {
    onOpenChange(false);
    
    // Store a flag in localStorage to trigger the platform tour
    localStorage.setItem("startTour", "true");
    
    // Navigate to the marketplace 
    navigate('/marketplace');
  };
  
  return (
    <>
      {isOpen && <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-[1100]"></canvas>}
      
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md z-[1101]">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/30 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <DialogHeader className="pt-8">
            <DialogTitle className="text-xl text-center">
              Identity Simulation Complete
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              The fixture tour is ready; no KYC approval was issued
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-primary/80" />
                  <h4 className="text-sm font-medium">Proof Experiment</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Synthetic proof-flow state recorded for this prototype
                </p>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="h-4 w-4 text-primary/80" />
                  <h4 className="text-sm font-medium">Agreement Simulations</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Access to local agreement simulation screens
                </p>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary/80" />
                  <h4 className="text-sm font-medium">Fixture Limits</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Explore simulated limit and volume states
                </p>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <PartyPopper className="h-4 w-4 text-primary/80" />
                  <h4 className="text-sm font-medium">Prototype Access</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Explore the legacy interface without production assurances
                </p>
              </div>
            </div>
            
            <div className="mt-6 rounded-lg bg-green-50 p-3 border border-green-200">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-green-100 mr-2 flex-shrink-0 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-800">Prototype Tour Available</h4>
                  <p className="text-xs text-green-700">
                    Explore synthetic commodities and offers. Nothing here constitutes a live market or trading account.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="w-full"
              onClick={handleGoToMarketplace}
            >
              Explore Legacy Prototype
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
