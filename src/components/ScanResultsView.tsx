import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoldRateMarquee } from "@/components/GoldRateMarquee";

interface ExtractedData {
  weight?: number;
  netWeight?: number;
  totalWeight?: number;
  grossWeight?: number;
  carat?: string;
  stoneWeight?: number;
  kundanWeight?: number;
  [key: string]: any;
}

interface PriceBreakdown {
  goldRate: number;
  goldWeight: number;
  goldValue: number;
  diamondRate?: number;
  diamondWeight?: number;
  diamondValue: number;
  diamondColor?: string;
  diamondClarity?: string;
  stoneWeight?: number;
  stoneValue: number;
  kundanWeight?: number;
  kundanValue: number;
  makingChargeRate: number | string;
  makingCharges: number;
  subTotal: number;
  gst: number;
  finalPrice: number;
}

interface ScanResultsViewProps {
  JewelleryType: "gold" | "diamond";
  extractedData: ExtractedData;
  priceBreakdown: PriceBreakdown;
  onScanAnother: () => void;
  onGoHome: () => void;
  onCalculateAnother?: () => void;
}

export function ScanResultsView({
  JewelleryType,
  extractedData,
  priceBreakdown,
  onScanAnother,
  onGoHome,
  onCalculateAnother,
}: ScanResultsViewProps) {
  const [expandedSections, setExpandedSections] = useState({
    goldValue: false,
    stoneValue: false,
    kundanValue: false,
    makingCharges: false,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return value.toFixed(3);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const grossWeight = extractedData.totalWeight || extractedData.grossWeight || priceBreakdown.goldWeight;
  const netWeight = extractedData.weight || extractedData.netWeight || priceBreakdown.goldWeight;
  const stoneWeight = extractedData.stoneWeight || priceBreakdown.stoneWeight || 0;
  const kundanWeight = extractedData.kundanWeight || priceBreakdown.kundanWeight || 0;
  const purity = extractedData.carat || "22K";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gold Rate Marquee */}
      <GoldRateMarquee />
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-gray-800">
              True Value
            </h1>
          </div>

        {/* Item Information Card */}
        <Card className="border-2 border-gray-200 rounded-2xl p-4 sm:p-6 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Item Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Gross Weight</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {formatWeight(grossWeight)}g
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Net Weight</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {formatWeight(netWeight)}g
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Stone Weight</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {formatWeight(stoneWeight)}g
              </div>
            </div>
            {kundanWeight > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Kundan Weight</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatWeight(kundanWeight)}g
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500 mb-1">Purity</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {purity}
              </div>
            </div>
          </div>
        </Card>

        {/* Grand Total */}
        <div className="bg-[#8B7355] text-white rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-semibold">Grand Total</span>
            <span className="text-2xl sm:text-3xl font-bold">
              {formatCurrency(priceBreakdown.finalPrice)}/-
            </span>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {/* Gold Value */}
          <Card className="border-0 bg-[#E5DDD5] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection("goldValue")}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[#d9cfc5] transition-colors"
            >
              <span className="text-lg sm:text-xl font-semibold text-gray-800">
                Gold Value
              </span>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(priceBreakdown.goldValue)}
                </span>
                {expandedSections.goldValue ? (
                  <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                )}
              </div>
            </button>
            {expandedSections.goldValue && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 bg-white/50">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gold Rate (22K)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(priceBreakdown.goldRate)}/g
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Gold Weight</span>
                  <span className="font-semibold text-gray-900">
                    {formatWeight(priceBreakdown.goldWeight)}g
                  </span>
                </div>
                <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                  <div className="font-semibold mb-1">Formula : Gold Rate x Gold Weight</div>
                  <div>
                    Calculation : {formatCurrency(priceBreakdown.goldRate)} × {formatWeight(priceBreakdown.goldWeight)} = {formatCurrency(priceBreakdown.goldValue)}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Stone Value */}
          {priceBreakdown.stoneValue > 0 && (
            <Card className="border-0 bg-[#E5DDD5] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection("stoneValue")}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[#d9cfc5] transition-colors"
              >
                <span className="text-lg sm:text-xl font-semibold text-gray-800">
                  Stone Value
                </span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(priceBreakdown.stoneValue)}
                  </span>
                  {expandedSections.stoneValue ? (
                    <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  )}
                </div>
              </button>
              {expandedSections.stoneValue && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 bg-white/50">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Stone Rate</span>
                    <span className="font-semibold text-gray-900">₹800/g</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Stone Weight</span>
                    <span className="font-semibold text-gray-900">
                      {formatWeight(stoneWeight)}g
                    </span>
                  </div>
                  <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                    <div className="font-semibold mb-1">Formula : Stone Rate x Stone Weight</div>
                    <div>
                      Calculation : ₹800 × {formatWeight(stoneWeight)} = {formatCurrency(priceBreakdown.stoneValue)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Kundan Value */}
          {priceBreakdown.kundanValue > 0 && (
            <Card className="border-0 bg-[#E5DDD5] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection("kundanValue")}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[#d9cfc5] transition-colors"
              >
                <span className="text-lg sm:text-xl font-semibold text-gray-800">
                  Kundan Value
                </span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(priceBreakdown.kundanValue)}
                  </span>
                  {expandedSections.kundanValue ? (
                    <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  )}
                </div>
              </button>
              {expandedSections.kundanValue && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 bg-white/50">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Kundan Rate</span>
                    <span className="font-semibold text-gray-900">₹200/g</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Kundan Weight</span>
                    <span className="font-semibold text-gray-900">
                      {formatWeight(kundanWeight)}g
                    </span>
                  </div>
                  <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                    <div className="font-semibold mb-1">Formula : Kundan Rate x Kundan Weight</div>
                    <div>
                      Calculation : ₹200 × {formatWeight(kundanWeight)} = {formatCurrency(priceBreakdown.kundanValue)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Making Charges */}
          <Card className="border-0 bg-[#E5DDD5] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection("makingCharges")}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[#d9cfc5] transition-colors"
            >
              <span className="text-lg sm:text-xl font-semibold text-gray-800">
                Making Charges
              </span>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(priceBreakdown.makingCharges)}
                </span>
                {expandedSections.makingCharges ? (
                  <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                )}
              </div>
            </button>
            {expandedSections.makingCharges && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 bg-white/50">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">
                    {JewelleryType === "gold" ? "Making Charge %" : "Making Charge Rate"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {typeof priceBreakdown.makingChargeRate === "number"
                      ? JewelleryType === "gold"
                        ? `${priceBreakdown.makingChargeRate}%`
                        : `₹${priceBreakdown.makingChargeRate}/g`
                      : priceBreakdown.makingChargeRate}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">
                    {JewelleryType === "gold" ? "Gold Value" : "Gold Weight"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {JewelleryType === "gold"
                      ? formatCurrency(priceBreakdown.goldValue)
                      : `${formatWeight(priceBreakdown.goldWeight)}g`}
                  </span>
                </div>
                <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                  <div className="font-semibold mb-1">
                    Formula : {JewelleryType === "gold" ? "Making % x Gold Value" : "Making Rate x Gold Weight"}
                  </div>
                  <div>
                    Calculation : {typeof priceBreakdown.makingChargeRate === "number"
                      ? JewelleryType === "gold"
                        ? `${priceBreakdown.makingChargeRate}% of ${formatCurrency(priceBreakdown.goldValue)}`
                        : `₹${priceBreakdown.makingChargeRate} × ${formatWeight(priceBreakdown.goldWeight)}g`
                      : "Custom"} = {formatCurrency(priceBreakdown.makingCharges)}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Action Buttons */}
        <div className={cn(
          "grid gap-3 sm:gap-4 pt-2",
          onCalculateAnother ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
        )}>
          <Button
            onClick={onGoHome}
            variant="outline"
            className="py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium border-2 border-gray-300 hover:bg-gray-50"
          >
            Go to homepage
          </Button>
          <Button
            onClick={onScanAnother}
            className="py-4 sm:py-6 bg-[#8B7355] hover:bg-[#7A6349] text-white rounded-xl text-base sm:text-lg font-medium"
          >
            Scan Another Tag
          </Button>
          {onCalculateAnother && (
            <Button
              onClick={onCalculateAnother}
              variant="outline"
              className="py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium border-2 border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355]/5"
            >
              Manual Calculator
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
