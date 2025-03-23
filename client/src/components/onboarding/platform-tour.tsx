import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowRight, 
  HelpCircle, 
  Home, 
  ShoppingCart, 
  RefreshCcw, 
  FileText, 
  User,
  X
} from "lucide-react";

type TourStep = {
  title: string;
  description: string;
  action: string;
  targetPath: string;
  icon: React.ReactNode;
};

const tourSteps: TourStep[] = [
  {
    title: "Welcome to BarterTrade",
    description: "Let's take a quick tour of the platform to help you get started with commodity trading and bartering.",
    action: "Start Tour",
    targetPath: "/",
    icon: <Home className="h-6 w-6 text-blue-500" />,
  },
  {
    title: "Dashboard Overview",
    description: "Your dashboard shows your trading stats, recent activity, and quick access to platform features.",
    action: "Next",
    targetPath: "/",
    icon: <Home className="h-6 w-6 text-blue-500" />,
  },
  {
    title: "Explore the Marketplace",
    description: "Browse available commodities, filter by type, and find trading opportunities.",
    action: "Go to Marketplace",
    targetPath: "/marketplace",
    icon: <ShoppingCart className="h-6 w-6 text-orange-500" />,
  },
  {
    title: "Create Barter Offers",
    description: "Propose trades with other users by offering your commodities in exchange for theirs.",
    action: "Go to Barter",
    targetPath: "/barter",
    icon: <RefreshCcw className="h-6 w-6 text-green-500" />,
  },
  {
    title: "Manage Your Contracts",
    description: "View all your active contracts, track deliveries, and manage payments.",
    action: "Go to Contracts",
    targetPath: "/contracts",
    icon: <FileText className="h-6 w-6 text-purple-500" />,
  },
  {
    title: "Complete Your Profile",
    description: "Update your profile information, verify your identity with KYC, and generate your ZKP identity.",
    action: "Go to Profile",
    targetPath: "/profile",
    icon: <User className="h-6 w-6 text-indigo-500" />,
  },
  {
    title: "You're All Set!",
    description: "You've completed the tour! Explore the platform and start trading with confidence.",
    action: "Start Trading",
    targetPath: "/marketplace",
    icon: <ShoppingCart className="h-6 w-6 text-blue-500" />,
  },
];

interface PlatformTourProps {
  forceTour?: boolean;
}

export default function PlatformTour({ forceTour = false }: PlatformTourProps) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();
  
  // Initialize tour based on localStorage or forceTour prop
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (forceTour || (!hasSeenTour && location === "/")) {
      setIsTourOpen(true);
    }
  }, [forceTour, location]);
  
  const handleNext = () => {
    const nextStep = currentStep + 1;
    
    // If we need to navigate to a different page
    if (tourSteps[currentStep].targetPath !== location) {
      setLocation(tourSteps[currentStep].targetPath);
    }
    
    // If there are more steps
    if (nextStep < tourSteps.length) {
      setCurrentStep(nextStep);
    } else {
      completeTour();
    }
  };
  
  const handlePrevious = () => {
    const prevStep = currentStep - 1;
    if (prevStep >= 0) {
      setCurrentStep(prevStep);
      if (tourSteps[prevStep].targetPath !== location) {
        setLocation(tourSteps[prevStep].targetPath);
      }
    }
  };
  
  const handleSkip = () => {
    completeTour();
  };
  
  const completeTour = () => {
    localStorage.setItem("hasSeenTour", "true");
    setIsTourOpen(false);
    setCurrentStep(0);
  };
  
  // Reset the tour so it can be started again
  const resetTour = () => {
    localStorage.removeItem("hasSeenTour");
    setCurrentStep(0);
    setIsTourOpen(true);
    setLocation("/");
  };
  
  const currentTourStep = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  
  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed bottom-4 right-4 rounded-full z-50 shadow-md bg-white"
        onClick={resetTour}
      >
        <HelpCircle className="h-5 w-5 text-blue-500" />
      </Button>
      
      <Dialog open={isTourOpen} onOpenChange={setIsTourOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {currentTourStep.icon}
                <DialogTitle className="ml-2">
                  {currentTourStep.title}
                </DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="pt-2">
              {currentTourStep.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative py-2">
            <div className="flex justify-center items-center">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 mx-1 rounded-full ${
                    index === currentStep
                      ? "bg-blue-500"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex space-x-2 mt-2 sm:mt-0">
              {!isFirstStep && (
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                >
                  Back
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={handleSkip}
              >
                {isLastStep ? "Close" : "Skip Tour"}
              </Button>
            </div>
            
            <Button 
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-blue-800"
            >
              {currentTourStep.action}
              {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}