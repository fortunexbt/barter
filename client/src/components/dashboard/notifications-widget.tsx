import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical } from "lucide-react";
import { Notification } from "@shared/schema";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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

  const createdAtDate = new Date(notification.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <div className={`flex items-start py-2 border-b border-neutral-200 last:border-0 ${notification.read ? 'opacity-60' : ''}`}>
      <div className="flex-shrink-0 mr-3">
        <div className={`w-8 h-8 bg-${notification.iconBg} bg-opacity-10 rounded-full flex items-center justify-center`}>
          <span className={`material-icons text-${notification.iconBg} text-sm`}>{notification.icon}</span>
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
