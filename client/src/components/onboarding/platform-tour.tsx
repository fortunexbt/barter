import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { 
  ShoppingBag, 
  ArrowRightLeft, 
  FileText, 
  Wallet,
  BookUser,
  Home,
  BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TourStep = {
  title: string;
  description: string;
  action: string;
  targetPath: string;
  icon: React.ReactNode;
};

interface PlatformTourProps {
  forceTour?: boolean;
}

export default function PlatformTour({ forceTour = false }: PlatformTourProps) {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useLocalStorage("showTour", true);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if we have the startTour flag in localStorage (set by KYC success modal)
    const shouldStartTour = localStorage.getItem("startTour") === "true";
    
    // Only show the tour if:
    // 1. User hasn't seen it before OR it's forced OR startTour flag is set
    // 2. User is logged in
    if ((showTour || forceTour || shouldStartTour) && user) {
      // Clear the startTour flag from localStorage
      if (shouldStartTour) {
        localStorage.removeItem("startTour");
      }
      
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showTour, forceTour, user]);
  
  const tourSteps: TourStep[] = [
    {
      title: "Welcome to BarterTrade",
      description: "This platform helps you trade commodities without traditional currency. Let's take a quick tour of the main features.",
      action: "Start Tour",
      targetPath: "/",
      icon: <Home className="h-8 w-8 text-primary" />
    },
    {
      title: "Browse the Marketplace",
      description: "Explore available commodities from traders around the world. Find exactly what you need with advanced filtering options.",
      action: "View Marketplace",
      targetPath: "/marketplace",
      icon: <ShoppingBag className="h-8 w-8 text-emerald-500" />
    },
    {
      title: "Make Barter Offers",
      description: "Propose trades directly with other users. Our AI matching algorithm helps find optimal trades based on value equivalence.",
      action: "See Barter System",
      targetPath: "/barter",
      icon: <ArrowRightLeft className="h-8 w-8 text-amber-500" />
    },
    {
      title: "Create Smart Contracts",
      description: "Secure your trades with blockchain-backed smart contracts. Our escrow system ensures safe commodity transfers.",
      action: "Explore Contracts",
      targetPath: "/contracts",
      icon: <FileText className="h-8 w-8 text-blue-500" />
    },
    {
      title: "Track Your Deals",
      description: "Monitor all your commodity trades and barter exchanges in one place with detailed performance analytics.",
      action: "View Deals",
      targetPath: "/deals",
      icon: <BarChart className="h-8 w-8 text-indigo-500" />
    },
    {
      title: "Complete Your Profile",
      description: "Update your trading profile and verify your identity with our secure zero-knowledge proof system for enhanced trust.",
      action: "Update Profile",
      targetPath: "/profile",
      icon: <BookUser className="h-8 w-8 text-violet-500" />
    }
  ];
  
  const handleNextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
      setLocation(tourSteps[currentStep + 1].targetPath);
    } else {
      completeTour();
    }
  };
  
  const handleSkipTour = () => {
    completeTour();
  };
  
  const completeTour = () => {
    setShowTour(false);
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full shadow-lg animate-in slide-in-from-bottom-10 duration-300">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentTourStep.icon}
                <span>{currentTourStep.title}</span>
              </CardTitle>
              <CardDescription>Step {currentStep + 1} of {tourSteps.length}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground mb-3">
            {currentTourStep.description}
          </p>
          <Progress value={progress} className="h-1" />
        </CardContent>
        <CardFooter className="pt-1 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSkipTour}
          >
            {currentStep < tourSteps.length - 1 ? 'Skip Tour' : 'Close'}
          </Button>
          <Button
            size="sm"
            onClick={handleNextStep}
          >
            {currentTourStep.action}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}