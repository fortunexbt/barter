import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bell, 
  Check, 
  Loader2, 
  X, 
  CheckCircle,
  MessageSquare,
  TruckIcon,
  FileCheck,
  CircleDollarSign,
  AlertCircle,
  BellOff
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  apiRequest,
  getQueryFn,
  queryClient
} from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch notifications for the current user
  const { 
    data: notifications = [], 
    isLoading, 
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [user, refetch]);
  
  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all", { userId: user?.id });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });
  
  // Handle clicking on a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsReadMutation.mutate(notification.id);
    
    // Navigate based on notification type
    switch(notification.type) {
      case "contract":
        navigate("/contracts");
        break;
      case "transaction":
        navigate("/transactions");
        break;
      case "barter":
        navigate("/barter");
        break;
      case "commodity":
        navigate("/marketplace");
        break;
      case "message":
        // Could navigate to a messaging section if implemented
        navigate("/");
        break;
      case "alert":
      default:
        // Generic notifications just close the dropdown
        break;
    }
    
    setIsOpen(false);
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string, iconName?: string | null) => {
    const iconSize = "h-5 w-5";
    
    if (iconName) {
      // If icon is specified in the notification data, could render a custom icon
      // For this implementation we'll use the default icon system
    }
    
    switch(type) {
      case "contract":
        return <FileCheck className={iconSize} />;
      case "transaction":
        return <CircleDollarSign className={iconSize} />;
      case "barter":
        return <TruckIcon className={iconSize} />;
      case "commodity":
        return <Check className={iconSize} />;
      case "message":
        return <MessageSquare className={iconSize} />;
      case "success":
        return <CheckCircle className={iconSize} />;
      case "alert":
      default:
        return <AlertCircle className={iconSize} />;
    }
  };
  
  // Get color style for notification type
  const getNotificationStyle = (type: string, iconBg?: string | null) => {
    if (iconBg) {
      return iconBg;
    }
    
    switch(type) {
      case "contract":
        return "bg-blue-50 text-blue-500 border-blue-200";
      case "transaction":
        return "bg-green-50 text-green-500 border-green-200";
      case "barter":
        return "bg-amber-50 text-amber-500 border-amber-200";
      case "commodity":
        return "bg-purple-50 text-purple-500 border-purple-200";
      case "message":
        return "bg-indigo-50 text-indigo-500 border-indigo-200";
      case "success":
        return "bg-emerald-50 text-emerald-500 border-emerald-200";
      case "alert":
      default:
        return "bg-red-50 text-red-500 border-red-200";
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
          {notifications.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending || notifications.every(n => n.read)}
                  >
                    {markAllAsReadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark all as read</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup className="max-h-[350px] overflow-auto py-1">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-6 text-center text-muted-foreground text-sm px-4">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p>Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm px-4">
              <BellOff className="h-6 w-6 mx-auto mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`p-2 rounded-full ${getNotificationStyle(notification.type, notification.iconBg)}`}>
                  {getNotificationIcon(notification.type, notification.icon)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt ?? '').toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              navigate("/notifications");
              setIsOpen(false);
            }}
          >
            View All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}