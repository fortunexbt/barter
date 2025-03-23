import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, AlertTriangle, User, Bell, Shield, LogOut, Key, Lock, CreditCard,
  Smartphone, MailOpen, Bell as BellIcon, CheckCircle, Settings,
  Laptop, Globe, LucideIcon, LockKeyhole, UserCog, History, ShieldAlert,
  ChevronRight, DollarSign, Briefcase, Download, Copy, Fingerprint, FileText
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  tradeAlerts: z.boolean(),
  marketUpdates: z.boolean(),
  contractUpdates: z.boolean(),
  newBarterOffers: z.boolean(),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification settings form
  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      tradeAlerts: true,
      marketUpdates: false,
      contractUpdates: true,
      newBarterOffers: true,
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: PasswordFormValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (settings: NotificationSettingsValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/notifications`, settings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update notification settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/users/${user?.id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      });
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };
  
  const onNotificationSettingsSubmit = (data: NotificationSettingsValues) => {
    updateNotificationSettingsMutation.mutate(data);
  };
  
  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Mock session data for device activity
  const deviceSessions = [
    {
      id: 1,
      device: "Desktop - Chrome",
      location: "New York, US",
      ip: "192.168.1.1",
      lastActive: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      current: true
    },
    {
      id: 2,
      device: "iPhone - Safari",
      location: "Chicago, US",
      ip: "192.168.1.2",
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      current: false
    }
  ];

  // Function to render a navigation item
  type NavItemProps = {
    icon: LucideIcon;
    label: string;
    value: string;
    active: boolean;
    count?: number;
  };

  const NavItem = ({ icon: Icon, label, value, active, count }: NavItemProps) => (
    <TabsTrigger 
      value={value} 
      className={`justify-start px-3 py-2 h-10 font-medium rounded-md ${
        active ? "bg-primary/10 text-primary" : "hover:bg-neutral-100 text-neutral-600"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto bg-neutral-200 text-neutral-700 rounded-full text-xs px-2 py-0.5">
          {count}
        </span>
      )}
    </TabsTrigger>
  );

  return (
    <AppShell>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Settings</h1>
            <p className="text-neutral-500 mt-1">Manage your account settings and preferences</p>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={user.profileImage || undefined} alt={user.fullName} />
                <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-neutral-500">@{user.username}</p>
              </div>
            </div>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-64 shrink-0">
              <div className="sticky top-6 space-y-1">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-3">
                  User Settings
                </div>
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1.5 p-0">
                  <NavItem 
                    icon={User} 
                    label="My Account" 
                    value="account" 
                    active={activeTab === "account"} 
                  />
                  <NavItem 
                    icon={Bell} 
                    label="Notifications" 
                    value="notifications" 
                    active={activeTab === "notifications"} 
                  />
                  <NavItem 
                    icon={Shield} 
                    label="Security & Privacy" 
                    value="security" 
                    active={activeTab === "security"} 
                  />
                  <NavItem 
                    icon={CreditCard} 
                    label="Trading Preferences" 
                    value="trading" 
                    active={activeTab === "trading"} 
                  />
                  
                  <div className="my-3">
                    <Separator />
                  </div>
                  
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-3">
                    Help & Support
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start px-3 py-2 h-10 text-neutral-600 hover:bg-neutral-100 font-normal"
                    asChild
                  >
                    <Link href="/help">
                      <UserCog className="h-4 w-4 mr-2" />
                      <span>Help Center</span>
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="justify-start px-3 py-2 h-10 text-neutral-600 hover:bg-neutral-100 font-normal"
                    asChild
                  >
                    <Link href="/documentation">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Documentation</span>
                    </Link>
                  </Button>
                  
                  <div className="my-3">
                    <Separator />
                  </div>
                  
                  <Button 
                    variant="ghost"
                    className="justify-start px-3 py-2 h-10 text-red-600 hover:bg-red-50 hover:text-red-700 font-normal"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </Button>
                </TabsList>
              </div>
            </div>
            
            <div className="flex-1">
              <TabsContent value="account" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      View and update your account details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={user?.username || ""} disabled />
                        <p className="text-xs text-neutral-500 mt-1">Cannot be changed</p>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={user?.email || ""} disabled />
                        <p className="text-xs text-neutral-500 mt-1">Cannot be changed</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={user?.fullName || ""} disabled />
                        <p className="text-xs text-neutral-500 mt-1">Edit in profile settings</p>
                      </div>
                      <div>
                        <Label htmlFor="accountLevel">Account Level</Label>
                        <Input id="accountLevel" value={user?.accountLevel || "Standard"} disabled />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="rounded-md p-4 bg-error bg-opacity-10 border border-error border-opacity-20">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-error mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-error">Danger Zone</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="border-error text-error hover:bg-error hover:bg-opacity-10 mt-2"
                              >
                                Delete Account
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                  This action cannot be undone. This will permanently delete your account
                                  and remove your data from our servers.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <p className="text-sm text-neutral-500">
                                  Please type <strong>delete my account</strong> to confirm:
                                </p>
                                <Input 
                                  className="mt-2" 
                                  placeholder="delete my account"
                                />
                              </div>
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => setConfirmDelete(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleDeleteAccount}
                                  disabled={deleteAccountMutation.isPending}
                                  className="bg-error text-white hover:bg-error/90"
                                >
                                  {deleteAccountMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete Account"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSettingsSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="emailNotifications">Email Notifications</Label>
                              <p className="text-sm text-neutral-500">
                                Receive notifications via email
                              </p>
                            </div>
                            <FormField
                              control={notificationForm.control}
                              name="emailNotifications"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex flex-row items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="pushNotifications">Push Notifications</Label>
                              <p className="text-sm text-neutral-500">
                                Receive notifications on your device
                              </p>
                            </div>
                            <FormField
                              control={notificationForm.control}
                              name="pushNotifications"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                          <div className="space-y-4">
                            <FormField
                              control={notificationForm.control}
                              name="tradeAlerts"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="cursor-pointer" htmlFor="tradeAlerts">Trade Alerts</Label>
                                    <FormDescription>
                                      Notify about new trade opportunities
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      id="tradeAlerts"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="marketUpdates"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="cursor-pointer" htmlFor="marketUpdates">Market Updates</Label>
                                    <FormDescription>
                                      Receive updates about market changes
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      id="marketUpdates"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="contractUpdates"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="cursor-pointer" htmlFor="contractUpdates">Contract Updates</Label>
                                    <FormDescription>
                                      Notifications about contract status changes
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      id="contractUpdates"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={notificationForm.control}
                              name="newBarterOffers"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between">
                                  <div className="space-y-0.5">
                                    <Label className="cursor-pointer" htmlFor="newBarterOffers">New Barter Offers</Label>
                                    <FormDescription>
                                      Notifications about new barter offers
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      id="newBarterOffers"
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="bg-primary text-white"
                          disabled={updateNotificationSettingsMutation.isPending}
                        >
                          {updateNotificationSettingsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Preferences"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security" className="m-0 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Password Settings</CardTitle>
                        <CardDescription className="mt-1">
                          Update your password and enhance your account security
                        </CardDescription>
                      </div>
                      <LockKeyhole className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="mb-4">
                      <div className="flex items-center mb-3">
                        <div className="bg-primary/10 p-1.5 rounded-full text-primary mr-3">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="text-sm text-neutral-700">
                          Your password was last updated <span className="font-medium">3 months ago</span>
                        </div>
                      </div>
                      <Progress value={70} className="h-2 bg-neutral-100" />
                      <p className="text-xs text-neutral-500 mt-2">
                        Password strength: <span className="text-amber-600 font-medium">Good</span> - 
                        It's recommended to update your password every 3 months
                      </p>
                    </div>

                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="focus:border-primary focus:ring-primary"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="focus:border-primary focus:ring-primary"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                At least 6 characters with uppercase, lowercase, and numbers
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="focus:border-primary focus:ring-primary"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary text-white hover:bg-primary/90"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Two-Factor Authentication</CardTitle>
                        <CardDescription className="mt-1">
                          Add an extra layer of security to your account
                        </CardDescription>
                      </div>
                      <Fingerprint className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                          <Smartphone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Authenticator App</h4>
                          <p className="text-xs text-neutral-500">
                            Use an authenticator app to generate verification codes
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Set up
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-full mr-4">
                          <MailOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Email Authentication</h4>
                          <p className="text-xs text-neutral-500">
                            Receive verification codes via email
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Set up
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription className="mt-1">
                          Manage devices where you're currently logged in
                        </CardDescription>
                      </div>
                      <Laptop className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deviceSessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            session.current ? 'bg-primary/5 border border-primary/20' : 'border border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-4 ${
                              session.current ? 'bg-primary/10' : 'bg-neutral-100'
                            }`}>
                              <Laptop className={`h-5 w-5 ${
                                session.current ? 'text-primary' : 'text-neutral-500'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium">{session.device}</h4>
                                {session.current && (
                                  <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-neutral-500">
                                  {session.location} • IP: {session.ip}
                                </p>
                                <span className="text-xs text-neutral-400">•</span>
                                <p className="text-xs text-neutral-500">
                                  Active {formatDate(session.lastActive, "just now")}
                                </p>
                              </div>
                            </div>
                          </div>
                          {!session.current && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                              Sign Out
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Login History</CardTitle>
                        <CardDescription className="mt-1">
                          Recent sign-in activities on your account
                        </CardDescription>
                      </div>
                      <History className="h-5 w-5 text-primary/60" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            {formatDate(new Date(Date.now() - 1000 * 60 * 5))}
                          </TableCell>
                          <TableCell>Chrome on Windows</TableCell>
                          <TableCell>New York, US</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                              Successful
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            {formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24))}
                          </TableCell>
                          <TableCell>Safari on iOS</TableCell>
                          <TableCell>Chicago, US</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                              Successful
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            {formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3))}
                          </TableCell>
                          <TableCell>Chrome on Android</TableCell>
                          <TableCell>Las Vegas, US</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                              Failed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trading" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Preferences</CardTitle>
                    <CardDescription>
                      Configure your trading settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Default Trading Currency</h3>
                      <Select defaultValue="usd">
                        <SelectTrigger className="w-full md:w-[240px]">
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">US Dollar (USD)</SelectItem>
                          <SelectItem value="eur">Euro (EUR)</SelectItem>
                          <SelectItem value="gbp">British Pound (GBP)</SelectItem>
                          <SelectItem value="jpy">Japanese Yen (JPY)</SelectItem>
                          <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                          <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Trading Limits</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="maxTradeValue">Maximum Trade Value</Label>
                          <div className="relative mt-1">
                            <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <Input id="maxTradeValue" type="number" defaultValue="25000" className="pl-10" />
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            Maximum value per individual trade
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="dailyLimit">Daily Trading Limit</Label>
                          <div className="relative mt-1">
                            <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <Input id="dailyLimit" type="number" defaultValue="100000" className="pl-10" />
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            Maximum total daily trading volume
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Smart Contract Preferences</h3>
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label>Automatic Contract Execution</Label>
                          <p className="text-sm text-neutral-500">
                            Automatically execute contracts when conditions are met
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4 mt-3">
                        <div className="space-y-0.5">
                          <Label>Gas Price Optimization</Label>
                          <p className="text-sm text-neutral-500">
                            Optimize gas fees for blockchain transactions
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
