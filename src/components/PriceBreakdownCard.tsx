import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Crown, Diamond, Gem, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceBreakdownProps {
  jewelryType: "gold" | "diamond";
  goldRate: number;
  goldWeight: number;
  goldValue: number;
  diamondRate?: number;
  diamondWeight?: number;
  diamondValue?: number;
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
}

export function PriceBreakdownCard({
  jewelryType,
  goldRate,
  goldWeight,
  goldValue,
  diamondRate,
  diamondWeight,
  diamondValue = 0,
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
}: PriceBreakdownProps) {
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatWeight = (value: number) => {
    return value.toFixed(3);
  };

  return (
    <Card className={cn(
      "shadow-lg border-2 overflow-hidden",
      jewelryType === "gold" 
        ? "border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-amber-50/20" 
        : "border-blue-200 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20"
    )}>
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-xl">
            {jewelryType === "gold" ? (
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
                    ? `${goldCarat.toUpperCase()} Diamond Jewelry`
                    : "Diamond Jewelry"
                  }
                </span>
              </>
            )}
          </CardTitle>
          {goldCarat && (
            <Badge variant="outline" className={cn(
              "font-semibold",
              jewelryType === "gold" ? "border-amber-300 text-amber-700" : "border-blue-300 text-blue-700"
            )}>
              {goldCarat.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        {/* Gold Calculation */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Crown className={cn(
                "h-4 w-4",
                jewelryType === "gold" ? "text-amber-500" : "text-blue-500"
              )} />
              <span className="text-sm text-gray-600">Rate</span>
            </div>
            <span className="font-semibold text-gray-900">
              ₹ {formatCurrency(goldRate)}/g
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 pl-6">Weight</span>
            <span className="font-semibold text-gray-900">{formatWeight(goldWeight)}g</span>
          </div>

          <div className="flex items-center justify-between py-2 bg-gray-50 -mx-4 px-4 rounded">
            <span className="text-sm text-gray-600 pl-6">Final Value</span>
            <span className="font-bold text-gray-900">₹ {formatCurrency(goldValue)}</span>
          </div>

          {/* Calculation Formula */}
          <div className="flex items-center justify-center py-2 text-xs text-gray-500 bg-amber-50/50 -mx-4 px-4">
            <Calculator className="h-3 w-3 mr-1" />
            <span>₹{formatCurrency(goldRate)} × {formatWeight(goldWeight)}g = ₹{formatCurrency(goldValue)}</span>
          </div>
        </div>

        {/* Diamond Calculation (if applicable) */}
        {diamondValue > 0 && diamondWeight && diamondRate && (
          <>
            <Separator className="my-0" />
            <div className="p-4 space-y-3 bg-blue-50/30">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Diamond className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Diamond Rate</span>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹ {formatCurrency(diamondRate)}/ct
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 pl-6">Weight</span>
                <span className="font-semibold text-gray-900">{formatWeight(diamondWeight)}ct</span>
              </div>

              <div className="flex items-center justify-between py-2 bg-white -mx-4 px-4 rounded">
                <span className="text-sm text-gray-600 pl-6">Final Value</span>
                <span className="font-bold text-gray-900">₹ {formatCurrency(diamondValue)}</span>
              </div>

              {certification && (
                <div className="flex items-center justify-center py-1">
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    {certification === "IGI" ? "IGI Certified" : "Self/Other Certification"}
                  </Badge>
                </div>
              )}

              {/* Calculation Formula */}
              <div className="flex items-center justify-center py-2 text-xs text-gray-500 bg-blue-50 -mx-4 px-4">
                <Calculator className="h-3 w-3 mr-1" />
                <span>₹{formatCurrency(diamondRate)} × {formatWeight(diamondWeight)}ct = ₹{formatCurrency(diamondValue)}</span>
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
                jewelryType === "gold" ? "text-amber-500" : "text-blue-500"
              )} />
              <span className="text-sm text-gray-600">Making Charges</span>
            </div>
            <span className="font-bold text-gray-900">₹ {formatCurrency(makingCharges)}</span>
          </div>

          {/* Making Charge Calculation */}
          <div className="flex items-center justify-center py-2 text-xs text-gray-500 bg-purple-50/50 -mx-4 px-4">
            <Calculator className="h-3 w-3 mr-1" />
            {typeof makingChargeRate === 'string' ? (
              <span>{makingChargeRate}</span>
            ) : jewelryType === "gold" ? (
              <span>{makingChargeRate}% of ₹{formatCurrency(goldValue)} = ₹{formatCurrency(makingCharges)}</span>
            ) : (
              <span>₹{makingChargeRate} × {formatWeight(goldWeight)}g = ₹{formatCurrency(makingCharges)}</span>
            )}
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
            <span className="text-xl font-bold text-gray-900">₹ {formatCurrency(subTotal)}</span>
          </div>
        </div>

        {/* Discount (if applicable) */}
        {discount > 0 && (
          <>
            <Separator className="my-0" />
            <div className="p-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Discount</span>
                <span className="font-bold text-green-600">-₹ {formatCurrency(discount)}</span>
              </div>
            </div>
          </>
        )}

        {/* Subtotal After Discount */}
        {subtotalAfterDiscount && subtotalAfterDiscount !== subTotal && (
          <>
            <Separator className="my-0" />
            <div className="p-4 bg-green-50/50">
              <div className="flex items-center justify-between py-2">
                <span className="text-base font-semibold text-gray-700">Subtotal after Discount</span>
                <span className="text-xl font-bold text-gray-900">₹ {formatCurrency(subtotalAfterDiscount)}</span>
              </div>
            </div>
          </>
        )}

        {/* GST */}
        <Separator className="my-0" />
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">GST (3%)</span>
            <span className="font-bold text-gray-900">₹ {formatCurrency(gst)}</span>
          </div>
          
          {/* GST Calculation */}
          <div className="flex items-center justify-center py-2 text-xs text-gray-500 bg-indigo-50/50 -mx-4 px-4 mt-2">
            <Calculator className="h-3 w-3 mr-1" />
            <span>3% of ₹{formatCurrency(subtotalAfterDiscount || subTotal)} = ₹{formatCurrency(gst)}</span>
          </div>
        </div>

        {/* Grand Total */}
        <Separator className="my-0 border-t-2 border-gray-300" />
        <div className={cn(
          "p-5",
          jewelryType === "gold" 
            ? "bg-gradient-to-r from-amber-500 to-yellow-500" 
            : "bg-gradient-to-r from-blue-500 to-indigo-500"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">Grand Total</span>
            <span className="text-2xl font-bold text-white">₹ {formatCurrency(finalPrice)}</span>
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
                <span className="font-semibold text-gray-900">₹ {formatCurrency(jewellerQuote)}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Difference</span>
                <Badge className={cn(
                  "font-bold",
                  (priceDifference || 0) > 0 
                    ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" 
                    : "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                )}>
                  {(priceDifference || 0) > 0 ? "+" : ""}₹ {formatCurrency(Math.abs(priceDifference || 0))}
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
