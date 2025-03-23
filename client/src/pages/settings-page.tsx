import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppShell from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  return (
    <AppShell>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Settings</h2>
          <p className="text-neutral-500">Manage your account settings and preferences</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64">
              <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                <TabsTrigger 
                  value="account" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-neutral-100"
                >
                  <span className="material-icons mr-2 text-sm">account_circle</span>
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-neutral-100"
                >
                  <span className="material-icons mr-2 text-sm">notifications</span>
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-neutral-100"
                >
                  <span className="material-icons mr-2 text-sm">security</span>
                  Security
                </TabsTrigger>
                <Separator className="my-4" />
                <div className="px-3">
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <span className="material-icons mr-2 text-sm">logout</span>
                    Logout
                  </Button>
                </div>
              </TabsList>
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
              
              <TabsContent value="security" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Update your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
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
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormDescription>
                                Password must be at least 6 characters long
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
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="bg-primary text-white"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <Separator className="my-8" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <p className="text-neutral-500 mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">Enable Two-Factor Authentication</Button>
                    </div>
                    
                    <Separator className="my-8" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Login Sessions</h3>
                      <div className="space-y-4">
                        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Current Session</p>
                              <p className="text-sm text-neutral-500">Chrome on Windows</p>
                              <p className="text-xs text-neutral-400">
                                IP: 192.168.1.1 • Last active: Just now
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-success bg-opacity-10 text-success">
                              Active
                            </Badge>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="gap-2 w-full sm:w-auto">
                          <span className="material-icons text-sm">logout</span>
                          Logout from All Other Devices
                        </Button>
                      </div>
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
