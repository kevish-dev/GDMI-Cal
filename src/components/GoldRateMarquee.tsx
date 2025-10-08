import { useRates } from "@/contexts/RatesContext";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface MCXGoldPrice {
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export function GoldRateMarquee() {
  const { goldRates } = useRates();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
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

  // Handle scroll events to pause animation when user is scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(scrollTimeout);
      
      // Resume animation after user stops scrolling
      scrollTimeout = setTimeout(() => {
        setIsUserScrolling(false);
      }, 2000); // Resume after 2 seconds of no scrolling
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('touchstart', () => setIsUserScrolling(true), { passive: true });
    scrollContainer.addEventListener('touchend', () => {
      scrollTimeout = setTimeout(() => setIsUserScrolling(false), 2000);
    }, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('touchstart', () => setIsUserScrolling(true));
      scrollContainer.removeEventListener('touchend', () => {
        scrollTimeout = setTimeout(() => setIsUserScrolling(false), 2000);
      });
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Get physical gold rates (24K, 22K, 18K, 14K)
  const physicalRates = goldRates.filter(rate => 
    ['24K', '22K', '18K', '14K'].includes(rate.carat)
  ).sort((a, b) => {
    const order = ['24K', '22K', '18K', '14K'];
    return order.indexOf(a.carat) - order.indexOf(b.carat);
  });

  if (physicalRates.length === 0) {
    return null;
  }

  // Find 24K rate for the special MCX-style display
  const goldRate24K = goldRates.find(rate => rate.carat === "24K");
  
  const marqueeItems = [
    // All gold rates with MCX-style animation and layout
    ...physicalRates.map(rate => {
      const isFeatureRate = rate.carat === '24K';
      const rateChange = rate.lastRate ? rate.rate - rate.lastRate : 0;
      const hasChange = rateChange !== 0;
      const isUp = rateChange > 0;
      
      return {
        type: isFeatureRate ? '24k-featured' as const : 'gold' as const,
        label: `Gold ${rate.carat === '24K' ? '24KT' : rate.carat}`,
        price: rate.rate,
        change: hasChange ? rateChange : undefined,
        changePercent: rate.lastRate && hasChange ? ((rateChange / rate.lastRate) * 100) : undefined,
        icon: hasChange 
          ? (isUp ? TrendingUp : TrendingDown)
          : TrendingUp,
        bgColor: isFeatureRate 
          ? (hasChange 
              ? (isUp 
                  ? 'from-green-50/90 to-emerald-50/90' 
                  : 'from-red-50/90 to-rose-50/90')
              : 'from-blue-50/90 to-indigo-50/90')
          : (hasChange 
              ? (isUp 
                  ? 'from-green-50/90 to-emerald-50/90' 
                  : 'from-red-50/90 to-rose-50/90')
              : 'from-yellow-50/90 to-amber-50/90'),
        borderColor: isFeatureRate 
          ? (hasChange 
              ? (isUp 
                  ? 'border-green-200/60' 
                  : 'border-red-200/60')
              : 'border-blue-200/60')
          : (hasChange 
              ? (isUp 
                  ? 'border-green-200/60' 
                  : 'border-red-200/60')
              : 'border-yellow-200/60'),
        textColor: isFeatureRate 
          ? (hasChange 
              ? (isUp 
                  ? 'text-green-800' 
                  : 'text-red-800')
              : 'text-blue-800')
          : (hasChange 
              ? (isUp 
                  ? 'text-green-800' 
                  : 'text-red-800')
              : 'text-yellow-800'),
        iconColor: isFeatureRate 
          ? (hasChange 
              ? (isUp 
                  ? 'text-green-600' 
                  : 'text-red-600')
              : 'text-blue-600')
          : (hasChange 
              ? (isUp 
                  ? 'text-green-600' 
                  : 'text-red-600')
              : 'text-yellow-600')
      };
    })
  ];

  return (
    <div className="w-full bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/60 shadow-sm">
      <div className="relative py-3 sm:py-4">
        {/* Live indicator - Fixed position */}
        <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center space-x-1.5 sm:space-x-2 bg-white/95 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm border border-slate-200/60">
          <div className="relative">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full"></div>
            <div className="absolute inset-0 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-400 rounded-full animate-ping opacity-60"></div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span className="hidden sm:inline">LIVE RATES</span>
            <span className="sm:hidden">LIVE</span>
          </span>
        </div>

        {/* Scroll indicator for mobile */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 sm:hidden">
          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-slate-200/60">
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>

        {/* Scrollable content container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide pl-16 sm:pl-24 pr-4 touch-pan-x scroll-smooth z-1000"
        >
          <div 
            className={cn(
              "flex space-x-3 sm:space-x-6 min-w-max pb-1",
              !isUserScrolling && "animate-marquee"
            )}
            style={isUserScrolling ? { animationPlayState: 'paused' } : {}}
          >
            {/* First set of items */}
            {marqueeItems.map((item, index) => (
              <div key={`first-${index}`} className="flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r border-2 transition-all duration-300 backdrop-blur-sm hover:scale-105",
                    "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full shadow-sm hover:shadow-lg",
                    item.bgColor,
                    item.borderColor,
                    item.textColor
                  )}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full animate-pulse"></div>
                  
                  <div className="relative z-10 flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <item.icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", item.iconColor)} />
                      <span className="text-xs sm:text-xs font-bold uppercase tracking-wide">
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                      </span>
                    </div>
                    
                    <div className="h-3 sm:h-4 w-px bg-current opacity-30"></div>
                    
                    <div className="flex items-center space-x-0.5 bg-white/20 rounded-md px-1.5 sm:px-2 py-0.5">
                      <IndianRupee className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="font-black text-xs sm:text-sm tracking-tight">
                        {item.price.toLocaleString('en-IN')}
                      </span>
                      {(item.type === 'gold' || item.type === '24k-featured') && (
                        <span className="text-[10px] sm:text-xs opacity-70 font-medium">/g</span>
                      )}
                    </div>

                    {/* Rate change indicator for all rates */}
                    {'change' in item && item.change !== undefined && (
                      <>
                        <div className="hidden sm:block h-4 w-px bg-current opacity-30"></div>
                        <div className={cn(
                          "flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded",
                          item.change >= 0 ? "bg-green-100/50 text-green-700" : "bg-red-100/50 text-red-700"
                        )}>
                          <span>{item.change >= 0 ? '+' : ''}{Math.round(item.change)}</span>
                          {'changePercent' in item && item.changePercent !== undefined && (
                            <span className="hidden sm:inline">({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Badge>
              </div>
            ))}
            
            {/* Second set of items for seamless loop */}
            {marqueeItems.map((item, index) => (
              <div key={`second-${index}`} className="flex-shrink-0">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r border-2 transition-all duration-300 backdrop-blur-sm hover:scale-105",
                    "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full shadow-sm hover:shadow-lg",
                    item.bgColor,
                    item.borderColor,
                    item.textColor
                  )}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full animate-pulse"></div>
                  
                  <div className="relative z-10 flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <item.icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", item.iconColor)} />
                      <span className="text-xs sm:text-xs font-bold uppercase tracking-wide">
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                      </span>
                    </div>
                    
                    <div className="h-3 sm:h-4 w-px bg-current opacity-30"></div>
                    
                    <div className="flex items-center space-x-0.5 bg-white/20 rounded-md px-1.5 sm:px-2 py-0.5">
                      <IndianRupee className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="font-black text-xs sm:text-sm tracking-tight">
                        {item.price.toLocaleString('en-IN')}
                      </span>
                      {(item.type === 'gold' || item.type === '24k-featured') && (
                        <span className="text-[10px] sm:text-xs opacity-70 font-medium">/g</span>
                      )}
                    </div>

                    {/* Rate change indicator for all rates */}
                    {'change' in item && item.change !== undefined && (
                      <>
                        <div className="hidden sm:block h-4 w-px bg-current opacity-30"></div>
                        <div className={cn(
                          "flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded",
                          item.change >= 0 ? "bg-green-100/50 text-green-700" : "bg-red-100/50 text-red-700"
                        )}>
                          <span>{item.change >= 0 ? '+' : ''}{Math.round(item.change)}</span>
                          {'changePercent' in item && item.changePercent !== undefined && (
                            <span className="hidden sm:inline">({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)</span>
                          )}
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
    </div>
  );
}