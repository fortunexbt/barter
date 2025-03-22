import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  MoreVertical, 
  Bell, 
  AlertCircle, 
  Check, 
  Mail, 
  DollarSign, 
  FileText 
} from "lucide-react";
import { Notification } from "@shared/schema";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { toast } = useToast();
  
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/notifications/${notification.id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createdAtDate = notification.createdAt ? new Date(notification.createdAt) : new Date();
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  // Helper function to get the icon based on the notification type
  const getNotificationIcon = () => {
    const iconType = notification.icon || notification.type;
    switch (iconType) {
      case 'notification':
      case 'Bell':
        return <Bell className="h-4 w-4" />;
      case 'alert':
      case 'AlertCircle':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
      case 'Check':
        return <Check className="h-4 w-4" />;
      case 'message':
      case 'Mail':
        return <Mail className="h-4 w-4" />;
      case 'payment':
      case 'DollarSign':
        return <DollarSign className="h-4 w-4" />;
      case 'contract':
      case 'FileText':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Helper function to get the background color
  const getBgColor = () => {
    const iconBg = notification.iconBg || 'primary';
    switch (iconBg) {
      case 'primary': return 'bg-primary/10';
      case 'secondary': return 'bg-blue-100';
      case 'success': return 'bg-green-100';
      case 'warning': return 'bg-amber-100';
      case 'error': return 'bg-red-100';
      case 'info': return 'bg-sky-100';
      default: return 'bg-primary/10';
    }
  };

  // Helper function to get the text color
  const getTextColor = () => {
    const iconBg = notification.iconBg || 'primary';
    switch (iconBg) {
      case 'primary': return 'text-primary';
      case 'secondary': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-sky-600';
      default: return 'text-primary';
    }
  };

  return (
    <div className={cn(
      "flex items-start py-2 border-b border-neutral-200 last:border-0",
      notification.read ? 'opacity-60' : ''
    )}>
      <div className="flex-shrink-0 mr-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          getBgColor()
        )}>
          <div className={getTextColor()}>
            {getNotificationIcon()}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-600">{notification.message}</p>
        <span className="text-xs text-neutral-400">{timeAgo}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-500 h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!notification.read && (
            <DropdownMenuItem onClick={() => markAsReadMutation.mutate()}>
              Mark as read
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default function NotificationsWidget() {
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    }
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-600">Notifications</h3>
          <Link href="/notifications">
            <Button variant="link" className="text-primary text-sm font-medium">View All</Button>
          </Link>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Failed to load notifications
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="p-6 text-center text-neutral-500">
            No notifications at the moment
          </div>
        ) : (
          <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-hide">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
