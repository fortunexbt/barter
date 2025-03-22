import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface QuickActionProps {
  icon: string;
  label: string;
  to: string;
  iconColor?: string;
}

const QuickAction = ({ icon, label, to, iconColor = "primary" }: QuickActionProps) => {
  return (
    <Link href={to}>
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center p-3 h-auto w-full border-neutral-200 hover:bg-neutral-50"
      >
        <span className={`material-icons text-${iconColor}`}>{icon}</span>
        <span className="mt-1 text-xs font-medium text-neutral-600">{label}</span>
      </Button>
    </Link>
  );
};

export default function QuickActions() {
  const actions = [
    { icon: "playlist_add", label: "New Listing", to: "/marketplace/new", iconColor: "primary" },
    { icon: "swap_horiz", label: "New Barter", to: "/barter/new", iconColor: "secondary" },
    { icon: "paid", label: "Add Funds", to: "/profile/funds", iconColor: "accent" },
    { icon: "history", label: "History", to: "/transactions", iconColor: "info" },
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
              iconColor={action.iconColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
