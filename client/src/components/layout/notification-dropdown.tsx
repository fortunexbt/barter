import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  FileText,
  RefreshCcw,
  DollarSign,
  Loader2,
  UserCheck
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch user's notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/user"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
    },
  });
  
  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/notifications/read-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
    },
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "system":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "kyc":
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case "contract":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "barter":
        return <RefreshCcw className="h-4 w-4 text-orange-500" />;
      case "transaction":
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };
  
  const unreadCount = notifications?.filter(notification => !notification.read).length || 0;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Mark all as read"
            )}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={cn(
                  "p-4 border-b last:border-b-0 hover:bg-neutral-50 flex cursor-pointer",
                  !notification.read && "bg-blue-50/40"
                )}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="mr-3 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium">{notification.title || notification.type}</h5>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.createdAt 
                      ? new Date(notification.createdAt).toLocaleString() 
                      : new Date().toLocaleString()
                    }
                  </p>
                </div>
                {!notification.read && (
                  <div className="ml-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}