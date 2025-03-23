import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, LoginData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "trader",
      accountLevel: "standard",
      profileImage: "",
    },
  });
  
  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        // This will delay navigation slightly to allow React Query to update properly
        setTimeout(() => navigate("/"), 50);
      }
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        // This will delay navigation slightly to allow React Query to update properly
        setTimeout(() => navigate("/"), 50);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">BT</div>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">BarterTrade Platform</h1>
            <p className="text-neutral-500 mt-2">Commodity Trading & Barter System</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  {/* Wallet Connection Options */}
                  <div className="w-full">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-neutral-500">Or connect with wallet</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask" className="h-5 w-5 mr-2" />
                        MetaMask
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <img src="https://rabby.io/assets/logo.svg" alt="Rabby" className="h-5 w-5 mr-2" />
                        Rabby
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center col-span-2">
                        <img src="https://walletconnect.com/images/logo.svg" alt="WalletConnect" className="h-5 w-5 mr-2" />
                        WalletConnect
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-neutral-500 mt-2">
                    Don't have an account?{" "}
                    <button 
                      onClick={() => setActiveTab("register")}
                      className="text-primary hover:underline"
                    >
                      Register now
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Enter your information to register</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value as string}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trader">Commodity Trader</SelectItem>
                                  <SelectItem value="broker">Broker</SelectItem>
                                  <SelectItem value="producer">Producer</SelectItem>
                                  <SelectItem value="buyer">Buyer</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Your role in the trading ecosystem
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  {/* Wallet Connection Options */}
                  <div className="w-full">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-neutral-500">Or register with wallet</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask" className="h-5 w-5 mr-2" />
                        MetaMask
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <img src="https://rabby.io/assets/logo.svg" alt="Rabby" className="h-5 w-5 mr-2" />
                        Rabby
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center col-span-2">
                        <img src="https://walletconnect.com/images/logo.svg" alt="WalletConnect" className="h-5 w-5 mr-2" />
                        WalletConnect
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-neutral-500 mt-2">
                    Already have an account?{" "}
                    <button 
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline"
                    >
                      Login
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-primary p-8 items-center justify-center">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-4">Trade Commodities. Barter with Confidence.</h1>
          <p className="text-lg mb-6">
            BarterTrade is an all-in-one platform that simplifies commodity trading, enables barter
            exchanges, and ensures secure transactions with integrated KYC and smart contracts.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-10">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-xl mb-2">Commodity Trading</h3>
              <p className="text-white/80">List, search, and trade commodities easily and securely</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-xl mb-2">Barter System</h3>
              <p className="text-white/80">Exchange goods without cash through our intelligent matching</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-xl mb-2">Smart Contracts</h3>
              <p className="text-white/80">Automatically generate and execute secure trading contracts</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-medium text-xl mb-2">KYC Compliance</h3>
              <p className="text-white/80">Fully compliant with regulatory requirements for security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
