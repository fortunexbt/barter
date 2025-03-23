import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAuth } from '@/hooks/use-auth';
import {
  ChevronRight,
  X,
  LayoutDashboard,
  User,
  ShoppingBag,
  FileText,
  ArrowRightLeft,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Tour step interface
interface TourStep {
  id: string;
  title: string;
  description: string;
  targetPath: string;
  targetSelector: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  action: string;
  icon: React.ReactNode;
}

export default function TourGuide() {
  const [_, navigate] = useLocation();
  const [showTour, setShowTour] = useLocalStorage('showEnhancedTour', true);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Define all tour steps
  const tourSteps: TourStep[] = [
    {
      id: 'dashboard',
      title: 'Welcome to BarterTrade',
      description: 'This is your dashboard where you can monitor your trades, view market analytics, and access key features.',
      targetPath: '/',
      targetSelector: '[data-tour="dashboard-overview"]',
      position: 'bottom',
      action: 'Next',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Update your trading profile and verify your identity with our secure zero-knowledge proof system.',
      targetPath: '/profile',
      targetSelector: '[data-tour="profile-kyc"]',
      position: 'left',
      action: 'Next',
      icon: <User className="h-5 w-5" />
    },
    {
      id: 'marketplace',
      title: 'Explore the Marketplace',
      description: 'Browse available commodities and find exactly what you need with our advanced filters.',
      targetPath: '/marketplace',
      targetSelector: '[data-tour="marketplace-listings"]',
      position: 'bottom',
      action: 'Next',
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      id: 'barter',
      title: 'Start Bartering',
      description: 'Create and manage barter offers with our AI-powered matching system for optimal trades.',
      targetPath: '/barter',
      targetSelector: '[data-tour="barter-offers"]',
      position: 'right',
      action: 'Next',
      icon: <ArrowRightLeft className="h-5 w-5" />
    },
    {
      id: 'contracts',
      title: 'Secure with Smart Contracts',
      description: 'Use blockchain-based smart contracts for secure and trustless commodity exchanges.',
      targetPath: '/contracts',
      targetSelector: '[data-tour="contracts-list"]',
      position: 'left',
      action: 'Next',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'deals',
      title: 'Track Your Deals',
      description: 'Monitor all your transactions, barter exchanges, and contract statuses in one place.',
      targetPath: '/deals',
      targetSelector: '[data-tour="deals-overview"]',
      position: 'bottom',
      action: 'Finish Tour',
      icon: <BarChart className="h-5 w-5" />
    }
  ];

  // Import useAuth hook from the context
  const { user } = useAuth();
  
  // Start tour after a delay, but only if KYC is completed
  useEffect(() => {
    if (showTour && user?.kycStatus === "verified") {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCurrentStep(0);
        navigate(tourSteps[0].targetPath);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showTour, user?.kycStatus, navigate]);

  // Find target element and position tooltip when step changes
  useEffect(() => {
    if (!isVisible) return;
    
    // Find the target element for the current step
    const findTargetElement = () => {
      const currentTourStep = tourSteps[currentStep];
      const element = document.querySelector(currentTourStep.targetSelector) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        updateHighlightPosition(element);
      } else {
        // Fallback if element not found
        console.log(`Target element ${currentTourStep.targetSelector} not found`);
        setTargetElement(null);
        setHighlight(null);
      }
    };
    
    // Navigate to the target path and find the element
    if (window.location.pathname !== tourSteps[currentStep].targetPath) {
      navigate(tourSteps[currentStep].targetPath);
      // Wait for navigation and DOM update
      setTimeout(findTargetElement, 300);
    } else {
      findTargetElement();
    }
    
    // Set up a mutation observer to handle dynamically loaded elements
    const observer = new MutationObserver(() => {
      findTargetElement();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      observer.disconnect();
    };
  }, [currentStep, isVisible]);

  // Update highlight position when window resizes
  useEffect(() => {
    if (!targetElement) return;
    
    const handleResize = () => {
      updateHighlightPosition(targetElement);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [targetElement]);

  // Update the highlight position based on the target element
  const updateHighlightPosition = (element: HTMLElement) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    // Add some padding around the element
    const padding = 4;
    setHighlight({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding + window.scrollX,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: 0, // Not used
      right: 0, // Not used
      x: 0, // Not used
      y: 0, // Not used
      toJSON: () => ({}) // Required by DOMRect interface
    });
    
    // Ensure the element is in view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Handle next step or complete tour
  const handleNextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      completeTour();
    }
  };

  // Skip the tour
  const handleSkipTour = () => {
    completeTour();
  };

  // Complete the tour
  const completeTour = () => {
    setShowTour(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Calculate tooltip position based on target element and specified position
  const getTooltipPosition = () => {
    if (!highlight) return {};
    
    const margin = 16; // Margin from the highlighted element
    
    switch (currentTourStep.position) {
      case 'top':
        return {
          top: `${highlight.top - 180 - margin}px`,
          left: `${highlight.left + highlight.width / 2 - 150}px`
        };
      case 'right':
        return {
          top: `${highlight.top + highlight.height / 2 - 90}px`,
          left: `${highlight.left + highlight.width + margin}px`
        };
      case 'bottom':
        return {
          top: `${highlight.top + highlight.height + margin}px`,
          left: `${highlight.left + highlight.width / 2 - 150}px`
        };
      case 'left':
        return {
          top: `${highlight.top + highlight.height / 2 - 90}px`,
          left: `${highlight.left - 300 - margin}px`
        };
      default:
        return {
          top: `${highlight.top + highlight.height + margin}px`,
          left: `${highlight.left + highlight.width / 2 - 150}px`
        };
    }
  };

  // Get arrow position based on position
  const getArrowPosition = () => {
    switch (currentTourStep.position) {
      case 'top':
        return 'bottom-[-10px] left-1/2 transform -translate-x-1/2 border-t-primary border-l-transparent border-r-transparent border-b-transparent';
      case 'right':
        return 'left-[-10px] top-1/2 transform -translate-y-1/2 border-r-primary border-t-transparent border-b-transparent border-l-transparent';
      case 'bottom':
        return 'top-[-10px] left-1/2 transform -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-[-10px] top-1/2 transform -translate-y-1/2 border-l-primary border-t-transparent border-b-transparent border-r-transparent';
      default:
        return 'top-[-10px] left-1/2 transform -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[999] pointer-events-none" />
      
      {/* Highlight */}
      {highlight && (
        <div
          className="fixed border-2 border-primary rounded-md z-[1000] pointer-events-none"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Pulsing animation */}
          <div className="absolute -inset-1 border border-primary rounded-lg animate-pulse opacity-70"></div>
        </div>
      )}
      
      {/* Tooltip */}
      <div
        className="fixed z-[1001] w-[300px] bg-background rounded-lg shadow-lg animate-in fade-in-50 duration-300"
        style={getTooltipPosition()}
      >
        {/* Arrow */}
        <div className={`absolute w-0 h-0 border-solid border-[10px] ${getArrowPosition()}`}></div>
        
        <div className="p-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {currentTourStep.icon}
              </div>
              <h3 className="text-base font-semibold">{currentTourStep.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleSkipTour}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2 mb-3">{currentTourStep.description}</p>
          
          <div className="mb-2">
            <Progress value={progress} className="h-1" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <Button size="sm" onClick={handleNextStep}>
              {currentTourStep.action}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}