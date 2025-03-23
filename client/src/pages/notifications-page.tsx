import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppShell from "@/components/layout/app-shell";
import { Notification } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2,
  Bell,
  Search,
  CheckCircle,
  MessageSquare,
  TruckIcon,
  FileCheck,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  apiRequest,
  queryClient
} from "@/lib/queryClient";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch notifications for the current user
  const { 
    data: notifications = [], 
    isLoading, 
    error 
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    }
  });
  
  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
      const res = await apiRequest("POST", "/api/notifications/read-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
  
  const getFilteredNotifications = () => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      return notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };
  
  const filteredNotifications = getFilteredNotifications();
  
  // Helper function to get the icon based on notification type
  const getNotificationIcon = (type: string, iconName: string | null) => {
    switch (iconName || type) {
      case 'check':
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'delivery':
        return <TruckIcon className="h-5 w-5" />;
      case 'contract':
        return <FileCheck className="h-5 w-5" />;
      case 'payment':
        return <CircleDollarSign className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };
  
  // Helper function to get background color based on icon background
  const getIconBackground = (iconBg: string | null) => {
    switch (iconBg) {
      case 'primary': return 'bg-primary/10 text-primary';
      case 'secondary': return 'bg-blue-100 text-blue-600';
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-amber-100 text-amber-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'info': return 'bg-sky-100 text-sky-600';
      default: return 'bg-primary/10 text-primary';
    }
  };
  
  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Notifications</h2>
          
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending || notifications.length === 0}
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking all...
                </>
              ) : (
                "Mark all as read"
              )}
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load notifications
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            {searchTerm ? "No notifications found matching your search" : "No notifications yet"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "hover:shadow-md transition-shadow",
                  !notification.read ? "border-l-4 border-l-primary" : ""
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4",
                      getIconBackground(notification.iconBg)
                    )}>
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">
                          {notification.message}
                        </p>
                        <span className="text-xs text-neutral-400 ml-2">
                          {new Date(notification.createdAt ?? '').toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant={notification.read ? "secondary" : "outline"}>
                          {notification.read ? "Read" : "Unread"}
                        </Badge>
                        
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}