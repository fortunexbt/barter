import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  BarChart2, 
  ShoppingCart, 
  RefreshCw, 
  Clock, 
  FileText, 
  User, 
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SidebarLinkProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "dashboard": return <BarChart2 size={20} />;
    case "storefront": return <ShoppingCart size={20} />;
    case "swap_horiz": return <RefreshCw size={20} />;
    case "history": return <Clock size={20} />;
    case "description": return <FileText size={20} />;
    case "person": return <User size={20} />;
    case "settings": return <Settings size={20} />;
    default: return <div className="w-5 h-5"></div>;
  }
};

const SidebarLink = ({ to, icon, label, active }: SidebarLinkProps) => {
  return (
    <Link href={to}>
      <div className={cn(
        "sidebar-link flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
        active 
          ? "bg-primary/10 border-l-2 border-primary text-primary" 
          : "text-neutral-500 hover:bg-neutral-100"
      )}>
        <span className={cn(
          "flex items-center justify-center mr-3 w-5 h-5",
          active ? "text-primary" : "text-neutral-400"
        )}>
          {getIcon(icon)}
        </span>
        {label}
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { to: "/", icon: "dashboard", label: "Dashboard" },
    { to: "/marketplace", icon: "storefront", label: "Marketplace" },
    { to: "/barter", icon: "swap_horiz", label: "Barter" },
    { to: "/transactions", icon: "history", label: "Transactions" },
    { to: "/contracts", icon: "description", label: "Contracts" },
    { to: "/profile", icon: "person", label: "Profile" },
    { to: "/settings", icon: "settings", label: "Settings" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-neutral-200 shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">BT</div>
          <h1 className="text-xl font-semibold text-neutral-600">BarterTrade</h1>
        </div>
      </div>
      
      <div className="py-4 flex flex-col h-full">
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location === item.to || (item.to !== "/" && location.startsWith(item.to))}
            />
          ))}
        </nav>
        
        <div className="px-3 mt-6 mb-4">
          <div className="bg-neutral-100 p-3 rounded-lg">
            <div className="flex items-center">
              {user?.kycStatus === "verified" ? (
                <div className="text-green-500 mr-2">
                  <CheckCircle size={20} />
                </div>
              ) : (
                <div className="text-amber-500 mr-2">
                  <AlertCircle size={20} />
                </div>
              )}
              <div>
                <h4 className="text-xs font-medium text-neutral-500">KYC STATUS</h4>
                <p className={cn(
                  "text-sm font-medium",
                  user?.kycStatus === "verified" ? "text-green-600" : "text-amber-600"
                )}>
                  {user?.kycStatus === "verified" ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
