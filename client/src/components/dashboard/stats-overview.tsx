import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  DollarSign, 
  RefreshCw, 
  FileText, 
  CheckCheck,
  AreaChart,
  BarChart2,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  label: string;
  value: number | string;
}

const StatCard = ({ icon, bgColor, textColor, label, value }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 transition-all hover:shadow-md hover:-translate-y-1 duration-200">
      <div className="flex items-center">
        <div className={cn("p-3 rounded-full", bgColor)}>
          <div className={cn("w-5 h-5", textColor)}>
            {icon}
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <h3 className="text-xl font-semibold text-neutral-600">{value}</h3>
        </div>
      </div>
    </div>
  );
};

interface StatsData {
  activeTrades: number;
  barterOffers: number;
  pendingContracts: number;
  completed: number;
}

export default function StatsOverview() {
  // This could be a real API call in a production environment
  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      // For now, return hard-coded stats for demo
      return {
        activeTrades: 12,
        barterOffers: 5,
        pendingContracts: 3,
        completed: 28
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
        Failed to load statistics
      </div>
    );
  }

  const stats = [
    { 
      icon: <DollarSign className="w-full h-full" />, 
      bgColor: "bg-primary/10", 
      textColor: "text-primary", 
      label: "Active Trades", 
      value: data.activeTrades 
    },
    { 
      icon: <RefreshCw className="w-full h-full" />, 
      bgColor: "bg-blue-100", 
      textColor: "text-blue-600", 
      label: "Barter Offers", 
      value: data.barterOffers 
    },
    { 
      icon: <FileText className="w-full h-full" />, 
      bgColor: "bg-amber-100", 
      textColor: "text-amber-600", 
      label: "Pending Contracts", 
      value: data.pendingContracts 
    },
    { 
      icon: <CheckCheck className="w-full h-full" />, 
      bgColor: "bg-green-100", 
      textColor: "text-green-600", 
      label: "Completed", 
      value: data.completed 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          bgColor={stat.bgColor}
          textColor={stat.textColor}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
}
