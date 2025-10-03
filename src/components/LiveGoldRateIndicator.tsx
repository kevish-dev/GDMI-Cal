import { useRates } from "@/contexts/RatesContext";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveGoldRateIndicatorProps {
  className?: string;
}

export function LiveGoldRateIndicator({ className }: LiveGoldRateIndicatorProps) {
  const { goldRates } = useRates();
  
  // Find 24K gold rate
  const goldRate24K = goldRates.find(rate => rate.carat === "24K");
  const currentRate = goldRate24K?.rate || 0;
  const lastRate = goldRate24K?.lastRate || currentRate;
  const rateChange = currentRate - lastRate;
  const isUp = rateChange > 0;
  const isDown = rateChange < 0;
  
  if (!currentRate) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <Badge 
          variant="secondary" 
          className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 to-green-50/90 border-emerald-200/60 text-emerald-800 px-4 py-2.5 text-sm font-medium rounded-full shadow-sm hover:shadow-lg transition-all duration-500 hover:scale-[1.02] backdrop-blur-sm border-2"
        >
          {/* Animated background pulse */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/20 to-green-100/20 rounded-full animate-pulse"></div>
          
          {/* Blinking indicator dot */}
          <div className="absolute -top-1.5 -right-1.5 z-10">
            <div className="relative">
              <div className="h-3.5 w-3.5 bg-emerald-500 rounded-full shadow-sm"></div>
              <div className="absolute inset-0 h-3.5 w-3.5 bg-emerald-400 rounded-full animate-ping opacity-60"></div>
              <div className="absolute inset-0.5 h-2.5 w-2.5 bg-emerald-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Rate content */}
          <div className="relative z-10 flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">LIVE</span>
            </div>
            
            <div className="h-4 w-px bg-emerald-300/50"></div>
            
            <div className="flex items-center space-x-1.5">
              {isUp ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : isDown ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span className="text-sm font-bold text-emerald-800">24K</span>
            </div>
            
            <div className="flex items-center space-x-0.5 bg-emerald-100/50 rounded-md px-2 py-0.5">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-700" />
              <span className="font-black text-emerald-900 text-sm tracking-tight">
                {currentRate.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-600 font-medium">/g</span>
            </div>
            
            {/* Rate change indicator */}
            {rateChange !== 0 && (
              <>
                <div className="h-4 w-px bg-emerald-300/50"></div>
                <div className={cn(
                  "flex items-center space-x-0.5 text-xs font-bold px-1.5 py-0.5 rounded",
                  isUp ? "bg-green-100/60 text-green-700" : "bg-red-100/60 text-red-700"
                )}>
                  <span>{isUp ? '+' : ''}{rateChange}</span>
                </div>
              </>
            )}
          </div>
        </Badge>
        
        {/* Last rate indicator */}
        {lastRate !== currentRate && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-100/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-slate-600 whitespace-nowrap">
            Last: ₹{lastRate.toLocaleString('en-IN')}/g
          </div>
        )}
      </div>
    </div>
  );
}