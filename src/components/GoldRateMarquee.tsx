import { useRates } from "@/contexts/RatesContext";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
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
    <div className="w-full bg-white border-b border-gray-200">
      <div className="relative py-3 sm:py-4">
        {/* Live Rates Badge - Fixed position */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
          <div className="bg-[#907F58] text-white px-4 sm:px-6 py-3 sm:py-3 rounded-r-md shadow-md">
            <span className="text-sm sm:text-base font-semibold tracking-wide">
              Live Rates
            </span>
          </div>
        </div>

        {/* Scrollable content container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide pl-28 sm:pl-36 pr-4 touch-pan-x scroll-smooth"
        >
          <div 
            className={cn(
              "flex space-x-3 sm:space-x-4 min-w-max",
              !isUserScrolling && "animate-marquee"
            )}
            style={isUserScrolling ? { animationPlayState: 'paused' } : {}}
          >
            {/* First set of items */}
            {marqueeItems.map((item, index) => {
              const isPositive = 'change' in item && item.change !== undefined && item.change >= 0;
              
              return (
                <div key={`first-${index}`} className="flex-shrink-0">
                  <div className="bg-white border-[0.4px] border-[#564C35] rounded-xl px-4 sm:px-6 py-2 sm:py-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Icon and Label */}
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        )}
                        <span className="text-xs sm:text-base font-semibold text-gray-900 uppercase tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-5 sm:h-6 w-px bg-gray-300"></div>
                      
                      {/* Price */}
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-base sm:text-lg font-semibold text-[#564C35]">
                          {item.price.toLocaleString('en-IN')}
                        </span>
                        {(item.type === 'gold' || item.type === '24k-featured') && (
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">/g</span>
                        )}
                      </div>

                      {/* Rate change indicator */}
                      {'change' in item && item.change !== undefined && (
                        <>
                          <div className="h-5 sm:h-6 w-px bg-gray-300"></div>
                          <div className="flex items-center space-x-1">
                            <span className={cn(
                              "text-sm sm:text-base font-semibold",
                              item.change >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {item.change >= 0 ? '+' : ''}{Math.round(item.change)}
                            </span>
                            {'changePercent' in item && item.changePercent !== undefined && (
                              <span className={cn(
                                "text-xs sm:text-sm font-semibold",
                                item.change >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Second set of items for seamless loop */}
            {marqueeItems.map((item, index) => {
              const isPositive = 'change' in item && item.change !== undefined && item.change >= 0;
              
              return (
                <div key={`second-${index}`} className="flex-shrink-0">
                  <div className="bg-white border-[0.4px] border-[#564C35] rounded-xl px-4 sm:px-6 py-2 sm:py-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {/* Icon and Label */}
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        )}
                        <span className="text-xs sm:text-base font-semibold text-gray-900 uppercase tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-5 sm:h-6 w-px bg-gray-300"></div>
                      
                      {/* Price */}
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-base sm:text-lg font-semibold text-[#564C35]">
                          {item.price.toLocaleString('en-IN')}
                        </span>
                        {(item.type === 'gold' || item.type === '24k-featured') && (
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">/g</span>
                        )}
                      </div>

                      {/* Rate change indicator */}
                      {'change' in item && item.change !== undefined && (
                        <>
                          <div className="h-5 sm:h-6 w-px bg-gray-300"></div>
                          <div className="flex items-center space-x-1">
                            <span className={cn(
                              "text-sm sm:text-base font-semibold",
                              item.change >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {item.change >= 0 ? '+' : ''}{Math.round(item.change)}
                            </span>
                            {'changePercent' in item && item.changePercent !== undefined && (
                              <span className={cn(
                                "text-xs sm:text-sm font-semibold",
                                item.change >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}