import { useRates } from "@/contexts/RatesContext";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MCXGoldPrice {
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export function GoldRateMarquee() {
  const { goldRates } = useRates();
  
  // Dummy MCX gold price data that updates every few seconds
  const [mcxPrice, setMcxPrice] = useState<MCXGoldPrice>({
    price: 69850,
    change: 125,
    changePercent: 0.18,
    lastUpdated: new Date().toLocaleTimeString()
  });

  // Update MCX price with dummy fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setMcxPrice(prev => {
        const basePrice = 69850;
        const randomChange = (Math.random() - 0.5) * 400; // ±200 variation
        const newPrice = Math.round(basePrice + randomChange);
        const change = newPrice - prev.price;
        const changePercent = ((change / prev.price) * 100);
        
        return {
          price: newPrice,
          change: Math.round(change),
          changePercent: parseFloat(changePercent.toFixed(2)),
          lastUpdated: new Date().toLocaleTimeString()
        };
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Get physical gold rates (24K, 22K, 18K)
  const physicalRates = goldRates.filter(rate => 
    ['24K', '22K', '18K'].includes(rate.carat)
  ).sort((a, b) => {
    const order = ['24K', '22K', '18K'];
    return order.indexOf(a.carat) - order.indexOf(b.carat);
  });

  if (physicalRates.length === 0) {
    return null;
  }

  const marqueeItems = [
    // Physical gold rates
    ...physicalRates.map(rate => ({
      type: 'physical' as const,
      label: `${rate.carat} Physical`,
      price: rate.rate,
      icon: TrendingUp,
      bgColor: 'from-yellow-50/90 to-amber-50/90',
      borderColor: 'border-yellow-200/60',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    })),
    // MCX gold price
    {
      type: 'mcx' as const,
      label: 'MCX Gold',
      price: mcxPrice.price,
      change: mcxPrice.change,
      changePercent: mcxPrice.changePercent,
      icon: mcxPrice.change >= 0 ? TrendingUp : TrendingDown,
      bgColor: mcxPrice.change >= 0 
        ? 'from-green-50/90 to-emerald-50/90' 
        : 'from-red-50/90 to-rose-50/90',
      borderColor: mcxPrice.change >= 0 
        ? 'border-green-200/60' 
        : 'border-red-200/60',
      textColor: mcxPrice.change >= 0 
        ? 'text-green-800' 
        : 'text-red-800',
      iconColor: mcxPrice.change >= 0 
        ? 'text-green-600' 
        : 'text-red-600'
    }
  ];

  return (
    <div className="w-full bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/60 shadow-sm">
      <div className="relative overflow-hidden py-3">
        {/* Live indicator */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-slate-200/60">
          <div className="relative">
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            <div className="absolute inset-0 h-2 w-2 bg-red-400 rounded-full animate-ping opacity-60"></div>
          </div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">LIVE RATES</span>
        </div>

        {/* Marquee content */}
        <div className="flex animate-marquee space-x-8 pl-32">
          {/* First set of items */}
          {marqueeItems.map((item, index) => (
            <div key={`first-${index}`} className="flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={cn(
                  "relative overflow-hidden bg-gradient-to-r border-2 px-4 py-2.5 text-sm font-medium rounded-full shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm",
                  item.bgColor,
                  item.borderColor,
                  item.textColor
                )}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full animate-pulse"></div>
                
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <item.icon className={cn("h-3.5 w-3.5", item.iconColor)} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  
                  <div className="h-4 w-px bg-current opacity-30"></div>
                  
                  <div className="flex items-center space-x-0.5 bg-white/20 rounded-md px-2 py-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="font-black text-sm tracking-tight">
                      {item.price.toLocaleString('en-IN')}
                    </span>
                    {item.type === 'physical' && (
                      <span className="text-xs opacity-70 font-medium">/g</span>
                    )}
                    {item.type === 'mcx' && (
                      <span className="text-xs opacity-70 font-medium">/10g</span>
                    )}
                  </div>

                  {/* MCX change indicator */}
                  {item.type === 'mcx' && (
                    <>
                      <div className="h-4 w-px bg-current opacity-30"></div>
                      <div className={cn(
                        "flex items-center space-x-1 text-xs font-bold px-1.5 py-0.5 rounded",
                        item.change >= 0 ? "bg-green-100/50 text-green-700" : "bg-red-100/50 text-red-700"
                      )}>
                        <span>{item.change >= 0 ? '+' : ''}{item.change}</span>
                        <span>({item.changePercent >= 0 ? '+' : ''}{item.changePercent}%)</span>
                      </div>
                    </>
                  )}
                </div>
              </Badge>
            </div>
          ))}
          
          {/* Duplicate set for seamless loop */}
          {marqueeItems.map((item, index) => (
            <div key={`second-${index}`} className="flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={cn(
                  "relative overflow-hidden bg-gradient-to-r border-2 px-4 py-2.5 text-sm font-medium rounded-full shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm",
                  item.bgColor,
                  item.borderColor,
                  item.textColor
                )}
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full animate-pulse"></div>
                
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <item.icon className={cn("h-3.5 w-3.5", item.iconColor)} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  
                  <div className="h-4 w-px bg-current opacity-30"></div>
                  
                  <div className="flex items-center space-x-0.5 bg-white/20 rounded-md px-2 py-0.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="font-black text-sm tracking-tight">
                      {item.price.toLocaleString('en-IN')}
                    </span>
                    {item.type === 'physical' && (
                      <span className="text-xs opacity-70 font-medium">/g</span>
                    )}
                    {item.type === 'mcx' && (
                      <span className="text-xs opacity-70 font-medium">/10g</span>
                    )}
                  </div>

                  {/* MCX change indicator */}
                  {item.type === 'mcx' && (
                    <>
                      <div className="h-4 w-px bg-current opacity-30"></div>
                      <div className={cn(
                        "flex items-center space-x-1 text-xs font-bold px-1.5 py-0.5 rounded",
                        item.change >= 0 ? "bg-green-100/50 text-green-700" : "bg-red-100/50 text-red-700"
                      )}>
                        <span>{item.change >= 0 ? '+' : ''}{item.change}</span>
                        <span>({item.changePercent >= 0 ? '+' : ''}{item.changePercent}%)</span>
                      </div>
                    </>
                  )}
                </div>
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}