import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Crown, Diamond, Gem, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceBreakdownProps {
  JewelleryType: "gold" | "diamond";
  goldRate: number;
  goldWeight: number;
  goldValue: number;
  diamondRate?: number;
  diamondWeight?: number;
  diamondValue?: number;
  diamondColor?: string;
  diamondClarity?: string;
  stoneWeight?: number;
  stoneValue?: number;
  kundanWeight?: number;
  kundanValue?: number;
  makingChargeRate: number | string;
  makingCharges: number;
  subTotal: number;
  discount?: number;
  subtotalAfterDiscount?: number;
  gst: number;
  finalPrice: number;
  jewellerQuote?: number;
  priceDifference?: number;
  goldCarat?: string;
  goldType?: string;
  certification?: string;
  // Additional extracted information
  extractedData?: {
    itemCode?: string;
    grossWeight?: number;
    netWeight?: number;
    huid?: string;
    hallmark?: string;
    type?: string;
    diameter?: string;
    purity?: string;
    rawText?: string;
  };
}

export function PriceBreakdownCard({
  JewelleryType,
  goldRate,
  goldWeight,
  goldValue,
  diamondRate,
  diamondWeight,
  diamondValue = 0,
  diamondColor,
  diamondClarity,
  stoneWeight,
  stoneValue = 0,
  kundanWeight,
  kundanValue = 0,
  makingChargeRate,
  makingCharges,
  subTotal,
  discount = 0,
  subtotalAfterDiscount,
  gst,
  finalPrice,
  jewellerQuote,
  priceDifference,
  goldCarat = "",
  goldType = "",
  certification = "",
  extractedData,
}: PriceBreakdownProps) {
  
  const formatCurrency = (value: number) => {
    return Math.round(value).toLocaleString("en-IN");
  };

  const formatWeight = (value: number) => {
    return value.toFixed(3);
  };

  return (
    <Card className={cn(
      "shadow-lg border-2 overflow-hidden",
      JewelleryType === "gold" 
        ? "border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20" 
        : "border-blue-200 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20"
    )}>
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xl">
            {JewelleryType === "gold" ? (
              <>
                <div className="p-2 rounded-full bg-amber-100">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-amber-700">
                  {goldCarat && goldType 
                    ? `${goldCarat.toUpperCase()} ${goldType.charAt(0).toUpperCase() + goldType.slice(1)} Gold`
                    : "Yellow Gold"
                  }
                </span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-blue-100">
                  <Diamond className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-blue-700">
                  {goldCarat 
                    ? `${goldCarat.toUpperCase()} Diamond Jewellery`
                    : "Diamond Jewellery"
                  }
                </span>
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {goldCarat && (
              <Badge variant="outline" className={cn(
                "font-semibold",
                JewelleryType === "gold" ? "border-amber-300 text-amber-700" : "border-blue-300 text-blue-700"
              )}>
                {goldCarat.toUpperCase()}
              </Badge>
            )}
            {/* Diamond Color & Clarity Badges */}
            {JewelleryType === "diamond" && (diamondColor || diamondClarity) && (
              <Badge variant="outline" className="border-blue-400 text-blue-700 font-semibold bg-blue-50">
                {diamondColor || "H-I"} • {diamondClarity || "SI"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        {/* Extracted Information Section */}
        {extractedData && (
          <>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  Extracted Information
                </Badge>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {extractedData.itemCode && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Item Code</span>
                    <span className="font-bold text-gray-900">{extractedData.itemCode}</span>
                  </div>
                )}
                {extractedData.type && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Type</span>
                    <span className="font-bold text-gray-900 capitalize">{extractedData.type}</span>
                  </div>
                )}
                {extractedData.grossWeight && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Gross Weight</span>
                    <span className="font-bold text-gray-900">{formatWeight(extractedData.grossWeight)}g</span>
                  </div>
                )}
                {extractedData.netWeight && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Net Weight</span>
                    <span className="font-bold text-gray-900">{formatWeight(extractedData.netWeight)}g</span>
                  </div>
                )}
                {stoneWeight && stoneWeight > 0 && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Stone Weight</span>
                    <span className="font-bold text-emerald-700">{formatWeight(stoneWeight)}g</span>
                  </div>
                )}
                {kundanWeight && kundanWeight > 0 && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Kundan Weight</span>
                    <span className="font-bold text-orange-700">{formatWeight(kundanWeight)}g</span>
                  </div>
                )}
                {extractedData.huid && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">HUID</span>
                    <span className="font-bold text-gray-900 text-[10px]">{extractedData.huid}</span>
                  </div>
                )}
                {extractedData.hallmark && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Hallmark</span>
                    <span className="font-bold text-gray-900">{extractedData.hallmark}</span>
                  </div>
                )}
                {extractedData.diameter && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Diameter</span>
                    <span className="font-bold text-gray-900">{extractedData.diameter}</span>
                  </div>
                )}
                {extractedData.purity && (
                  <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">Purity</span>
                    <span className="font-bold text-gray-900">{extractedData.purity}</span>
                  </div>
                )}
              </div>
            </div>
            <Separator className="my-0" />
          </>
        )}

        {/* Gold Calculation */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Crown className={cn(
                "h-4 w-4",
                JewelleryType === "gold" ? "text-amber-500" : "text-blue-500"
              )} />
              <span className="text-sm text-gray-600">Rate</span>
            </div>
            <span className="font-semibold text-gray-900">
               {formatCurrency(goldRate)}/g
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 pl-6">Weight</span>
            <span className="font-semibold text-gray-900">{formatWeight(goldWeight)}g</span>
          </div>

          <div className="flex items-center justify-between py-2 bg-gray-50 -mx-4 px-4 rounded">
            <span className="text-sm text-gray-600 pl-6">Final Value</span>
            <span className="font-bold text-gray-900"> {formatCurrency(goldValue)}</span>
          </div>

          {/* Calculation Formula */}
          <div className="space-y-1 py-2 text-xs bg-amber-50/50 -mx-4 px-4">
            <div className="flex items-center justify-center text-gray-600">
              <Calculator className="h-3 w-3 mr-1" />
              <span className="font-semibold">Formula: Gold Rate × Gold Weight</span>
            </div>
            <div className="flex items-center justify-center text-gray-500">
              <span className="font-medium">Calculation: {formatCurrency(goldRate)} × {formatWeight(goldWeight)}g = {formatCurrency(goldValue)}</span>
            </div>
          </div>
        </div>

        {/* Diamond Calculation (if applicable) */}
        {diamondValue > 0 && diamondWeight && diamondRate && (
          <>
            <Separator className="my-0" />
            <div className="p-4 space-y-3 bg-blue-50/30">
              {/* Diamond Specifications Header */}
              <div className="bg-blue-100/50 -mx-4 px-4 py-3 mb-2">
                <div className="flex items-center justify-center gap-2">
                  <Diamond className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-blue-800 text-sm">Diamond Specifications</span>
                </div>
              </div>

              {/* Diamond Color & Clarity - Prominent Display */}
              {(diamondColor || diamondClarity) && (
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 -mx-4 px-4 py-3 border-y border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Color & Clarity</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-600 text-white font-bold text-base px-3 py-1">
                        {diamondColor || "H-I"}
                      </Badge>
                      <span className="text-blue-600 font-bold">•</span>
                      <Badge variant="secondary" className="bg-blue-600 text-white font-bold text-base px-3 py-1">
                        {diamondClarity || "SI"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Diamond className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Diamond Rate</span>
                </div>
                <span className="font-semibold text-gray-900">
                   {formatCurrency(diamondRate)}/ct
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 pl-6">Weight</span>
                <span className="font-semibold text-gray-900">{formatWeight(diamondWeight)}ct</span>
              </div>

              <div className="flex items-center justify-between py-2 bg-white -mx-4 px-4 rounded">
                <span className="text-sm text-gray-600 pl-6">Final Value</span>
                <span className="font-bold text-gray-900"> {formatCurrency(diamondValue)}</span>
              </div>

              {certification && (
                <div className="flex items-center justify-center py-1">
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {certification === "IGI" ? "IGI Certified" : "Self/Other Certification"}
                  </Badge>
                </div>
              )}

              {/* Calculation Formula */}
              <div className="space-y-1 py-2 text-xs bg-blue-50 -mx-4 px-4">
                <div className="flex items-center justify-center text-gray-600">
                  <Calculator className="h-3 w-3 mr-1" />
                  <span className="font-semibold">Formula: Diamond Rate × Diamond Weight</span>
                </div>
                <div className="flex items-center justify-center text-gray-500">
                  <span className="font-medium">Calculation: {formatCurrency(diamondRate)} × {formatWeight(diamondWeight)}ct = {formatCurrency(diamondValue)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Stone Weight & Value */}
        {stoneValue > 0 && stoneWeight && (
          <>
            <Separator className="my-0" />
            <div className="p-4 space-y-3 bg-emerald-50/30">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Gem className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-600">Stone Rate</span>
                </div>
                <span className="font-semibold text-gray-900">₹800/g</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 pl-6">Weight</span>
                <span className="font-semibold text-gray-900">{formatWeight(stoneWeight)}g</span>
              </div>

              <div className="flex items-center justify-between py-2 bg-white -mx-4 px-4 rounded">
                <span className="text-sm text-gray-600 pl-6">Final Value</span>
                <span className="font-bold text-gray-900">₹{formatCurrency(stoneValue)}</span>
              </div>

              {/* Calculation Formula */}
              <div className="space-y-1 py-2 text-xs bg-emerald-50 -mx-4 px-4">
                <div className="flex items-center justify-center text-gray-600">
                  <Calculator className="h-3 w-3 mr-1" />
                  <span className="font-semibold">Formula: Stone Weight × ₹800</span>
                </div>
                <div className="flex items-center justify-center text-gray-500">
                  <span className="font-medium">Calculation: {formatWeight(stoneWeight)}g × ₹800 = ₹{formatCurrency(stoneValue)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Kundan Weight & Value */}
        {kundanValue > 0 && kundanWeight && (
          <>
            <Separator className="my-0" />
            <div className="p-4 space-y-3 bg-orange-50/30">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Gem className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Kundan Rate</span>
                </div>
                <span className="font-semibold text-gray-900">₹200/g</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 pl-6">Weight</span>
                <span className="font-semibold text-gray-900">{formatWeight(kundanWeight)}g</span>
              </div>

              <div className="flex items-center justify-between py-2 bg-white -mx-4 px-4 rounded">
                <span className="text-sm text-gray-600 pl-6">Final Value</span>
                <span className="font-bold text-gray-900">₹{formatCurrency(kundanValue)}</span>
              </div>

              {/* Calculation Formula */}
              <div className="space-y-1 py-2 text-xs bg-orange-50 -mx-4 px-4">
                <div className="flex items-center justify-center text-gray-600">
                  <Calculator className="h-3 w-3 mr-1" />
                  <span className="font-semibold">Formula: Kundan Weight × ₹200</span>
                </div>
                <div className="flex items-center justify-center text-gray-500">
                  <span className="font-medium">Calculation: {formatWeight(kundanWeight)}g × ₹200 = ₹{formatCurrency(kundanValue)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Making Charges */}
        <Separator className="my-0" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Gem className={cn(
                "h-4 w-4",
                JewelleryType === "gold" ? "text-amber-500" : "text-blue-500"
              )} />
              <span className="text-sm text-gray-600">Making Charges</span>
            </div>
            <span className="font-bold text-gray-900"> {formatCurrency(makingCharges)}</span>
          </div>

          {/* Making Charge Calculation */}
          <div className="space-y-1 py-2 text-xs bg-purple-50/50 -mx-4 px-4">
            <div className="flex items-center justify-center text-gray-600">
              <Calculator className="h-3 w-3 mr-1" />
              {typeof makingChargeRate === 'string' ? (
                <span className="font-semibold">Formula: {makingChargeRate}</span>
              ) : JewelleryType === "gold" ? (
                <span className="font-semibold">Formula: Making Charge % × Gold Value</span>
              ) : (
                <span className="font-semibold">Formula: Making Charge Rate × Gold Weight</span>
              )}
            </div>
            <div className="flex items-center justify-center text-gray-500">
              {typeof makingChargeRate === 'string' ? (
                <span className="font-medium">Custom calculation</span>
              ) : JewelleryType === "gold" ? (
                <span className="font-medium">Calculation: {makingChargeRate}% of {formatCurrency(goldValue)} = {formatCurrency(makingCharges)}</span>
              ) : (
                <span className="font-medium">Calculation: {makingChargeRate} × {formatWeight(goldWeight)}g = {formatCurrency(makingCharges)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Subtotal */}
        <Separator className="my-0 border-gray-300" />
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-base font-semibold text-gray-700">Sub Total</span>
              <div className="text-xs text-gray-500 mt-1">
                {formatWeight(goldWeight)}g Gross Wt.
              </div>
            </div>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(subTotal)}</span>
          </div>
          
          {/* Subtotal Calculation Formula */}
          <div className="space-y-1 py-2 text-xs bg-gray-100 -mx-4 px-4 mt-2">
            <div className="flex items-center justify-center text-gray-600">
              <Calculator className="h-3 w-3 mr-1" />
              <span className="font-semibold">
                Formula: Gold Value 
                {diamondValue > 0 && ' + Diamond Value'}
                {stoneValue > 0 && ' + Stone Value'}
                {kundanValue > 0 && ' + Kundan Value'}
                {' + Making Charges'}
              </span>
            </div>
            <div className="flex items-center justify-center text-gray-500">
              <span className="font-medium">
                Calculation: ₹{formatCurrency(goldValue)} 
                {diamondValue > 0 && ` + ₹${formatCurrency(diamondValue)}`}
                {stoneValue > 0 && ` + ₹${formatCurrency(stoneValue)}`}
                {kundanValue > 0 && ` + ₹${formatCurrency(kundanValue)}`}
                {` + ₹${formatCurrency(makingCharges)} = ₹${formatCurrency(subTotal)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Discount (if applicable) */}
        {discount > 0 && (
          <>
            <Separator className="my-0" />
            <div className="p-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="font-bold text-green-600">- {formatCurrency(discount)}</span>
              </div>
            </div>
          </>
        )}

        {/* Grand Total (using subtotalAfterDiscount if discount exists, otherwise subTotal) */}
        <Separator className="my-0 border-t-2 border-gray-300" />
        <div className={cn(
          "p-5",
          JewelleryType === "gold" 
            ? "bg-gradient-to-r from-amber-500 to-yellow-500" 
            : "bg-gradient-to-r from-blue-500 to-indigo-500"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">Grand Total</span>
            <span className="text-2xl font-bold text-white"> {formatCurrency(subtotalAfterDiscount || subTotal)}</span>
          </div>
        </div>

        {/* Jeweller Quote Comparison */}
        {jewellerQuote && jewellerQuote > 0 && (
          <>
            <Separator className="my-0" />
            <div className="p-4 bg-gray-50 space-y-3">
              <h4 className="font-semibold text-gray-700 text-center text-sm">Price Comparison</h4>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Jeweller's Quote</span>
                <span className="font-semibold text-gray-900"> {formatCurrency(jewellerQuote)}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Difference</span>
                <Badge className={cn(
                  "font-bold",
                  (priceDifference || 0) > 0 
                    ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" 
                    : "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                )}>
                  {(priceDifference || 0) > 0 ? "+" : ""} {formatCurrency(Math.abs(priceDifference || 0))}
                  {(priceDifference || 0) > 0 ? " Higher" : " Lower"}
                </Badge>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 bg-white rounded py-2 px-3">
                  {(priceDifference || 0) > 0 
                    ? "Market price is higher than jeweller's quote" 
                    : "Market price is lower than jeweller's quote"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="p-4 bg-gray-100 border-t">
          <p className="text-xs text-center text-gray-500">
            Price calculated based on current market rates and standard making charges
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
