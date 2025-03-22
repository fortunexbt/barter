import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { CheckCircle, Clock, User, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileSummary() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const tradingSince = user.tradingSince 
    ? format(new Date(user.tradingSince), 'MMMM yyyy') 
    : 'N/A';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-600">Account Summary</h3>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-neutral-200 overflow-hidden">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.fullName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-medium">
                {user.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-neutral-600">{user.fullName}</h4>
            <p className="text-xs text-neutral-500">{user.role}</p>
            <div className="flex items-center mt-1">
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full flex items-center",
                user.kycStatus === "verified" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-amber-100 text-amber-600"
              )}>
                {user.kycStatus === "verified" 
                  ? <BadgeCheck className="h-3 w-3 mr-1" /> 
                  : <Clock className="h-3 w-3 mr-1" />
                }
                {user.kycStatus === "verified" ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">KYC Status</span>
            <span className={cn("text-xs font-medium flex items-center", 
              user.kycStatus === "verified" ? "text-green-600" : "text-amber-600"
            )}>
              {user.kycStatus === "verified" 
                ? <><CheckCircle className="h-3 w-3 mr-1" />Complete</>
                : <><Clock className="h-3 w-3 mr-1" />Pending</>
              }
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Account Level</span>
            <span className="text-xs font-medium text-neutral-600">{user.accountLevel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-500">Trading Since</span>
            <span className="text-xs font-medium text-neutral-600">{tradingSince}</span>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 pt-4">
          <Link href="/profile">
            <Button variant="link" className="text-primary">Edit Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
