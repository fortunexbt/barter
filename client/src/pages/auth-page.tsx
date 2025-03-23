import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, LoginData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Wallet, ShieldCheck, ShieldAlert, Database, GitMerge, Code } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SiEthereum, SiPostgresql, SiVite } from "react-icons/si";

const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();

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
        // Set flags in localStorage to trigger welcome modal and tour on first login
        localStorage.setItem("hasSeenWelcome", "false");
        localStorage.setItem("showTour", "true");
        
        // Show welcome message
        toast({
          title: "Registration Successful!",
          description: "Welcome to BarterTrade. Complete your KYC verification to start trading.",
          duration: 5000,
        });
        
        // Navigate to homepage where welcome modal will appear
        setTimeout(() => navigate("/"), 100);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-3">
              <Logo variant="large" showText={false} />
            </div>
            <h2 className="text-3xl font-bold mb-1">BarterTrade</h2>
            <p className="text-neutral-500">Commodities Trading & Barter Platform</p>
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to sign in</CardDescription>
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
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2 flex items-center justify-center"
                        onClick={() => {
                          loginForm.setValue("username", "admin");
                          loginForm.setValue("password", "admin123");
                          setTimeout(() => loginForm.handleSubmit(onLoginSubmit)(), 100);
                        }}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Quick Login
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
                        <Wallet className="h-5 w-5 mr-2 text-orange-500" />
                        MetaMask
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <Wallet className="h-5 w-5 mr-2 text-green-600" />
                        Yubikey
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center col-span-2">
                        <Wallet className="h-5 w-5 mr-2 text-black" />
                        Ledger
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
                                value={field.value || "trader"} 
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trader">Trader</SelectItem>
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
                        <Wallet className="h-5 w-5 mr-2 text-orange-500" />
                        MetaMask
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center">
                        <Wallet className="h-5 w-5 mr-2 text-green-600" />
                        Yubikey
                      </Button>
                      <Button variant="outline" type="button" className="flex items-center justify-center col-span-2">
                        <Wallet className="h-5 w-5 mr-2 text-black" />
                        Ledger
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-neutral-500 mt-2">
                    Already have an account?{" "}
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-primary hover:underline"
                    >
                      Login instead
                    </button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Feature highlight */}
      <div className="hidden lg:block flex-1 bg-primary/10 p-12">
        <div className="h-full flex flex-col justify-center max-w-md mx-auto">
          <div className="space-y-6">
            <div className="rounded-lg bg-white p-2 w-16 h-16 flex items-center justify-center shadow-sm">
              <Logo variant="large" showText={false} />
            </div>
            <h2 className="text-3xl font-bold">AI-Powered Commodity Trading</h2>
            <p className="text-gray-600">
              BarterTrade uses advanced zero-knowledge proofs and blockchain smart contracts to create a secure, private, and efficient marketplace for commodity trading.
            </p>
            
            <div className="border-t border-gray-200 pt-6 mt-8">
              <h3 className="font-medium mb-4">Platform Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-primary/20 mr-3 flex items-center justify-center text-primary text-sm">✓</div>
                  <span>Secure identity verification with ZKP</span>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-primary/20 mr-3 flex items-center justify-center text-primary text-sm">✓</div>
                  <span>Blockchain-backed smart contracts</span>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-primary/20 mr-3 flex items-center justify-center text-primary text-sm">✓</div>
                  <span>AI-powered barter matching</span>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-primary/20 mr-3 flex items-center justify-center text-primary text-sm">✓</div>
                  <span>Real-time market insights</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-8">
              <h3 className="font-medium mb-4 text-sm text-gray-500">Powered By</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <GitMerge className="h-4 w-4" />
                  <span>Semaphore</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <SiEthereum className="h-4 w-4" />
                  <span>Ethers.js</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Wallet className="h-4 w-4" />
                  <span>WalletConnect</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <SiPostgresql className="h-4 w-4" />
                  <span>PostgreSQL</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <SiVite className="h-4 w-4" />
                  <span>Vite</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Code className="h-4 w-4" />
                  <span>Lucide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}