import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  Bell, 
  Search, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleMobileSidebar: () => void;
}

export default function Header({ toggleMobileSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality
    console.log("Searching for:", searchTerm);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-neutral-600">BarterTrade</h1>
          </div>
        </div>
        
        <div className="hidden md:flex md:flex-1">
          <form onSubmit={handleSearch} className="relative w-full max-w-xs">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="text" 
              placeholder="Search commodities, users..." 
              className="w-full pl-10 pr-4 py-2"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-neutral-500" />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-accent rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden mr-2">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-neutral-600 hidden md:block">
                  {user?.fullName || "User"}
                </span>
                <span className="material-icons ml-1 text-neutral-400">arrow_drop_down</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <span className="material-icons mr-2 text-sm">person</span>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <span className="material-icons mr-2 text-sm">settings</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span className="material-icons mr-2 text-sm">logout</span>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
