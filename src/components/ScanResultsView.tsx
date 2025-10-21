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
  stoneWeightUnit?: string;
  kundanWeight?: number;
  kundanValue: number;
  makingChargeRate: number | string;
  makingCharges: number;
  subTotal: number;
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
    diamondValue: false,
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
  const stoneWeightUnit = priceBreakdown.stoneWeightUnit || (JewelleryType === 'diamond' ? 'ct' : 'g');
  const kundanWeight = extractedData.kundanWeight || priceBreakdown.kundanWeight || 0;
  const purity = extractedData.carat || "22K";

  return (
    <div className="min-h-fit bg-gray-50">
      
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-4xl md:text-5xl font-serif text-gray-800" style={{fontFamily: "'Cormorant Garamond', serif"}}>
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
              <div className="text-sm text-gray-500 mb-1">Net Weight (Gold)</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {formatWeight(netWeight)}g
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Purity</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">
                {purity}
              </div>
            </div>
            {/* Diamond Weight - Only show for diamond jewelry */}
            {JewelleryType === "diamond" && priceBreakdown.diamondWeight && priceBreakdown.diamondWeight > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Diamond Weight</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatWeight(priceBreakdown.diamondWeight)}ct
                  <span className="text-xs text-gray-500 ml-1">
                    ({formatWeight(priceBreakdown.diamondWeight * 0.2)}g)
                  </span>
                </div>
              </div>
            )}
            {/* Diamond Color - Only show for diamond jewelry if available */}
            {JewelleryType === "diamond" && priceBreakdown.diamondColor && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Diamond Color</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {priceBreakdown.diamondColor}
                </div>
              </div>
            )}
            {/* Diamond Clarity - Only show for diamond jewelry if available */}
            {JewelleryType === "diamond" && priceBreakdown.diamondClarity && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Diamond Clarity</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {priceBreakdown.diamondClarity}
                </div>
              </div>
            )}
            {/* Only show stone weight if value exists */}
            {stoneWeight > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Stone Weight</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatWeight(stoneWeight)}{stoneWeightUnit}
                  {stoneWeightUnit === 'ct' && ` (${formatWeight(stoneWeight * 0.2)}g)`}
                </div>
              </div>
            )}
            {/* Only show kundan weight if value exists */}
            {kundanWeight > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Kundan Weight</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatWeight(kundanWeight)}g
                </div>
              </div>
            )}
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

          {/* Diamond Value - Only show if diamond jewelry and value exists */}
          {JewelleryType === "diamond" && priceBreakdown.diamondValue > 0 && (
            <Card className="border-0 bg-[#E5DDD5] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection("diamondValue" as any)}
                className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-[#d9cfc5] transition-colors"
              >
                <span className="text-lg sm:text-xl font-semibold text-gray-800">
                  Diamond Value
                </span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatCurrency(priceBreakdown.diamondValue)}
                  </span>
                  {(expandedSections as any).diamondValue ? (
                    <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  )}
                </div>
              </button>
              {(expandedSections as any).diamondValue && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 bg-white/50">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Diamond Rate (per carat)</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(priceBreakdown.diamondRate || 0)}/ct
                    </span>
                  </div>
                  {priceBreakdown.diamondColor && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Diamond Color</span>
                      <span className="font-semibold text-gray-900">
                        {priceBreakdown.diamondColor}
                      </span>
                    </div>
                  )}
                  {priceBreakdown.diamondClarity && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Diamond Clarity</span>
                      <span className="font-semibold text-gray-900">
                        {priceBreakdown.diamondClarity}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Diamond Weight</span>
                    <span className="font-semibold text-gray-900">
                      {formatWeight(priceBreakdown.diamondWeight || 0)}ct
                    </span>
                  </div>
                  <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                    <div className="font-semibold mb-1">Formula : Diamond Rate x Diamond Weight</div>
                    <div>
                      Calculation : {formatCurrency(priceBreakdown.diamondRate || 0)} × {formatWeight(priceBreakdown.diamondWeight || 0)}ct = {formatCurrency(priceBreakdown.diamondValue)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Stone Value - Only show if value exists */}
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
                    <span className="font-semibold text-gray-900">
                      {stoneWeightUnit === 'ct' ? '₹800/g (converted)' : '₹800/g'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Stone Weight</span>
                    <span className="font-semibold text-gray-900">
                      {formatWeight(stoneWeight)}{stoneWeightUnit}
                      {stoneWeightUnit === 'ct' && ` (${formatWeight(stoneWeight * 0.2)}g)`}
                    </span>
                  </div>
                  <div className="pt-2 text-xs sm:text-sm text-gray-600 italic">
                    <div className="font-semibold mb-1">Formula : Stone Rate x Stone Weight</div>
                    <div>
                      {stoneWeightUnit === 'ct' 
                        ? `Calculation : ${formatWeight(stoneWeight)}ct × 0.2 = ${formatWeight(stoneWeight * 0.2)}g × ₹800 = ${formatCurrency(priceBreakdown.stoneValue)}`
                        : `Calculation : ₹800 × ${formatWeight(stoneWeight)}g = ${formatCurrency(priceBreakdown.stoneValue)}`
                      }
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Kundan Value - Only show if value exists */}
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
                      Calculation : ₹200 × {formatWeight(kundanWeight)}g = {formatCurrency(priceBreakdown.kundanValue)}
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
          onCalculateAnother ? "grid-cols-2" : "grid-cols-1"
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
        </div>
      </div>
      </div>
    </div>
  );
}
