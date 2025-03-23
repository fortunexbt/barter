import { Repeat, BarChart3 } from "lucide-react";

interface LogoProps {
  variant?: "default" | "small" | "large";
  showText?: boolean;
}

export function Logo({ variant = "default", showText = true }: LogoProps) {
  const iconSize = variant === "small" ? 18 : variant === "large" ? 36 : 24;
  const fontSize = variant === "small" ? "text-lg" : variant === "large" ? "text-3xl" : "text-xl";
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center relative">
        <div className="bg-primary text-white rounded-full p-2 z-10">
          <Repeat className={`h-${iconSize / 12} w-${iconSize / 12}`} />
        </div>
        <div className="bg-primary/80 text-white rounded-full p-2 absolute -right-2">
          <BarChart3 className={`h-${iconSize / 12} w-${iconSize / 12}`} />
        </div>
      </div>
      {showText && (
        <span className={`font-bold ${fontSize} text-primary tracking-tight`}>
          BarterTrade
        </span>
      )}
    </div>
  );
}