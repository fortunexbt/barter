import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  PlusSquare,
  RefreshCw,
  Wallet,
  Clock,
  ListPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  textColor?: string;
}

const QuickAction = ({ icon, label, to, textColor = "text-primary" }: QuickActionProps) => {
  return (
    <Link href={to}>
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center p-3 h-auto w-full border-neutral-200 hover:bg-neutral-50"
      >
        <div className={cn("w-5 h-5", textColor)}>
          {icon}
        </div>
        <span className="mt-1 text-xs font-medium text-neutral-600">{label}</span>
      </Button>
    </Link>
  );
};

export default function QuickActions() {
  const actions = [
    { 
      icon: <ListPlus className="w-full h-full" />, 
      label: "New Listing", 
      to: "/marketplace/new", 
      textColor: "text-primary" 
    },
    { 
      icon: <RefreshCw className="w-full h-full" />, 
      label: "New Barter", 
      to: "/barter/new", 
      textColor: "text-blue-600" 
    },
    { 
      icon: <Wallet className="w-full h-full" />, 
      label: "Notional Funds",
      to: "/profile/funds", 
      textColor: "text-amber-600" 
    },
    { 
      icon: <Clock className="w-full h-full" />, 
      label: "History", 
      to: "/transactions", 
      textColor: "text-sky-600" 
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-600">Quick Actions</h3>
      </div>
      
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <QuickAction
              key={index}
              icon={action.icon}
              label={action.label}
              to={action.to}
              textColor={action.textColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
