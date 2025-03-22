import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: number | string;
}

const StatCard = ({ icon, iconColor, label, value }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 transition-all hover:shadow-md hover:-translate-y-1 duration-200">
      <div className="flex items-center">
        <div className={`bg-${iconColor} bg-opacity-10 p-3 rounded-full`}>
          <span className={`material-icons text-${iconColor}`}>{icon}</span>
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
    { icon: "attach_money", iconColor: "primary", label: "Active Trades", value: data.activeTrades },
    { icon: "swap_horiz", iconColor: "secondary", label: "Barter Offers", value: data.barterOffers },
    { icon: "description", iconColor: "accent", label: "Pending Contracts", value: data.pendingContracts },
    { icon: "done_all", iconColor: "success", label: "Completed", value: data.completed }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          iconColor={stat.iconColor}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
}
