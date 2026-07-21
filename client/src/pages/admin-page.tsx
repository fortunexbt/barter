import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { User, Commodity, Contract, KycDocument } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Shield, Database, FileCheck, Package2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/ui/logo";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("users");

  // Redirect if user is not an admin
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">Only administrators can access this page.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-md">
            <Logo variant="small" showText={false} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500">Inspect fixture users, identity states, and prototype activity</p>
          </div>
        </div>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Platform
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="users" className="flex items-center justify-center">
            <Shield className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="kyc" className="flex items-center justify-center">
            <FileCheck className="h-4 w-4 mr-2" />
            Identity Fixtures
          </TabsTrigger>
          <TabsTrigger value="commodities" className="flex items-center justify-center">
            <Package2 className="h-4 w-4 mr-2" />
            Commodities
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center justify-center">
            <Database className="h-4 w-4 mr-2" />
            Contracts
          </TabsTrigger>
        </TabsList>

        <UsersTab active={activeTab === "users"} />
        <KycVerificationsTab active={activeTab === "kyc"} />
        <CommoditiesTab active={activeTab === "commodities"} />
        <ContractsTab active={activeTab === "contracts"} />
      </Tabs>
    </div>
  );
}

function UsersTab({ active }: { active: boolean }) {
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
    enabled: active,
  });

  if (!active) return <TabsContent value="users" />;

  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Account Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "destructive" : "default"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <KycStatusBadge status={user.kycStatus} />
                    </TableCell>
                    <TableCell>{user.accountLevel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function KycVerificationsTab({ active }: { active: boolean }) {
  const { data: kycDocs, isLoading } = useQuery({
    queryKey: ["/api/admin/kyc-documents"],
    queryFn: getQueryFn<(KycDocument & { user: User })[]>({ on401: "throw" }),
    enabled: active,
  });

  if (!active) return <TabsContent value="kyc" />;

  return (
    <TabsContent value="kyc">
      <Card>
        <CardHeader>
          <CardTitle>Identity Fixture States</CardTitle>
          <CardDescription>Inspect synthetic prototype identity records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Document Number</TableHead>
                  <TableHead>Proof Demo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kycDocs?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>{doc.user?.username || `User ID: ${doc.userId}`}</TableCell>
                    <TableCell>{doc.documentType}</TableCell>
                    <TableCell>{doc.documentNumber}</TableCell>
                    <TableCell>
                      {doc.zkpVerified ? (
                        <Badge variant="success">Demo complete</Badge>
                      ) : (
                        <Badge variant="secondary">Demo pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <KycStatusBadge status={doc.verified ? "verified" : "pending"} />
                    </TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function CommoditiesTab({ active }: { active: boolean }) {
  const { data: commodities, isLoading } = useQuery({
    queryKey: ["/api/admin/commodities"],
    queryFn: getQueryFn<(Commodity & { ownerName: string })[]>({ on401: "throw" }),
    enabled: active,
  });

  if (!active) return <TabsContent value="commodities" />;

  return (
    <TabsContent value="commodities">
      <Card>
        <CardHeader>
          <CardTitle>Commodities</CardTitle>
          <CardDescription>Manage all commodities on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commodities?.map((commodity) => (
                  <TableRow key={commodity.id}>
                    <TableCell>{commodity.id}</TableCell>
                    <TableCell>{commodity.name}</TableCell>
                    <TableCell>{commodity.ownerName || `Owner ID: ${commodity.ownerId}`}</TableCell>
                    <TableCell>{commodity.subcategory || commodity.category}</TableCell>
                    <TableCell>{formatPrice(commodity.price, commodity.priceUnit)}</TableCell>
                    <TableCell>{formatVolume(commodity.volume, commodity.volumeUnit)}</TableCell>
                    <TableCell>
                      <StatusBadge status={commodity.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function ContractsTab({ active }: { active: boolean }) {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/admin/contracts"],
    queryFn: getQueryFn<(Contract & { sellerName: string; buyerName: string; commodityName: string })[]>({ on401: "throw" }),
    enabled: active,
  });

  if (!active) return <TabsContent value="contracts" />;

  return (
    <TabsContent value="contracts">
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>Manage all contracts on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts?.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.id}</TableCell>
                    <TableCell>{contract.contractNumber}</TableCell>
                    <TableCell>{contract.sellerName || `Seller ID: ${contract.sellerId}`}</TableCell>
                    <TableCell>{contract.buyerName || `Buyer ID: ${contract.buyerId}`}</TableCell>
                    <TableCell>{contract.commodityName || `Commodity ID: ${contract.commodityId}`}</TableCell>
                    <TableCell>${formatNumber(contract.price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={contract.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function KycStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case "verified":
      return <Badge variant="success">Demo complete</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case "active":
    case "available":
    case "completed":
      return <Badge variant="success">{status}</Badge>;
    case "pending":
    case "in_progress":
      return <Badge variant="warning">{status}</Badge>;
    case "cancelled":
    case "expired":
    case "rejected":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
}

function formatPrice(price: number, unit: string): string {
  return `$${formatNumber(price)}/${unit}`;
}

function formatVolume(volume: number, unit: string): string {
  return `${formatNumber(volume)} ${unit}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
