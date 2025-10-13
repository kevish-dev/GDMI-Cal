import { useState } from "react";
import { Layout } from "@/components/Layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine } from "lucide-react";
import { JewelleryTagScanner } from "@/components/JewelryTagScanner";
import { GoldRateMarquee } from "@/components/GoldRateMarquee";
import { ContactSupportBox } from "@/components/ContactSupportBox";
import { UserVerificationModal } from "@/components/UserVerificationModal";
import { PriceBreakdownCard } from "@/components/PriceBreakdownCard";
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { Link } from "react-router-dom";

interface PriceBreakdown {
  goldRate: number;
  goldWeight: number;
  goldValue: number;
  diamondRate?: number;
  diamondWeight?: number;
  diamondValue: number;
  diamondColor?: string;
  diamondClarity?: string;
  makingChargeRate: number | string;
  makingCharges: number;
  subTotal: number;
  gst: number;
  finalPrice: number;
}

interface ScanResultData {
  JewelleryType: "gold" | "diamond";
  extractedData: any;
  verificationAnswers: any;
  makingCharges: any;
  calculatedPrice: number;
  priceBreakdown: PriceBreakdown;
}

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const { toast } = useToast();
  const { addCalculation } = useRates();

  const handleScanComplete = async (result: any) => {
    // Store the complete scan result
    setScanResult(result);

    // Add calculation to analytics
    await addCalculation({
      type: result.JewelleryType as "gold" | "diamond",
      totalValue: result.calculatedPrice,
      goldWeight: result.extractedData.weight || result.extractedData.netWeight || 0,
      diamondWeight: result.extractedData.diamondWeight,
      carat: result.extractedData.carat?.toLowerCase(),
      JewelleryType: result.JewelleryType === "gold" ? result.extractedData.type : "diamond",
      diamondColor: result.extractedData.color,
      diamondClarity: result.extractedData.clarity,
      certification: result.verificationAnswers?.certificationType,
    });

    toast({
      title: "Scan completed successfully!",
      description: `Price calculated: ${result.calculatedPrice.toLocaleString("en-IN")}`,
    });
  };

  const handleResetScan = () => {
    setScanResult(null);
  };

  return (
    <Layout>
      {/* Live Gold Rate Marquee */}
      <GoldRateMarquee />

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Jewellery Price Calculator
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Scan your jewellery tag and get instant accurate pricing
            </p>
          </div>

          {/* Show price breakdown and extracted info if scan result is available */}
          {scanResult ? (
            <div className="space-y-6">
              {/* Extracted Information Card */}
              <Card className="shadow-lg border-2 border-primary/30">
                <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <ScanLine className="h-5 w-5 text-primary" />
                    <span>Extracted Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scanResult.extractedData.itemCode && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Item Code:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.itemCode}</span>
                      </div>
                    )}
                    {scanResult.extractedData.carat && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Carat/Purity:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.carat.toUpperCase()}</span>
                      </div>
                    )}
                    {(scanResult.extractedData.weight || scanResult.extractedData.netWeight) && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Weight:</span>
                        <span className="text-sm font-semibold">
                          {(scanResult.extractedData.weight || scanResult.extractedData.netWeight)?.toFixed(3)}g
                        </span>
                      </div>
                    )}
                    {scanResult.extractedData.grossWeight && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Gross Weight:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.grossWeight.toFixed(3)}g</span>
                      </div>
                    )}
                    {scanResult.extractedData.stoneWeight && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Stone Weight:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.stoneWeight.toFixed(3)}g</span>
                      </div>
                    )}
                    {scanResult.extractedData.diamondWeight && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Diamond Weight:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.diamondWeight.toFixed(3)}ct</span>
                      </div>
                    )}
                    {scanResult.extractedData.color && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Diamond Color:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.color}</span>
                      </div>
                    )}
                    {scanResult.extractedData.clarity && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Diamond Clarity:</span>
                        <span className="text-sm font-semibold">{scanResult.extractedData.clarity}</span>
                      </div>
                    )}
                    {scanResult.extractedData.type && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Jewellery Type:</span>
                        <span className="text-sm font-semibold capitalize">{scanResult.extractedData.type}</span>
                      </div>
                    )}
                    {scanResult.makingCharges.goldType && (
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 font-medium">Gold Type:</span>
                        <span className="text-sm font-semibold capitalize">{scanResult.makingCharges.goldType}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Price Breakdown */}
              <div>
                <h3 className="font-semibold text-center text-lg mb-4">Price Calculation</h3>
                
                <PriceBreakdownCard
                  JewelleryType={scanResult.JewelleryType}
                  goldRate={scanResult.priceBreakdown.goldRate}
                  goldWeight={scanResult.priceBreakdown.goldWeight}
                  goldValue={scanResult.priceBreakdown.goldValue}
                  diamondRate={scanResult.priceBreakdown.diamondRate}
                  diamondWeight={scanResult.priceBreakdown.diamondWeight}
                  diamondValue={scanResult.priceBreakdown.diamondValue}
                  diamondColor={scanResult.priceBreakdown.diamondColor}
                  diamondClarity={scanResult.priceBreakdown.diamondClarity}
                  makingChargeRate={scanResult.priceBreakdown.makingChargeRate}
                  makingCharges={scanResult.priceBreakdown.makingCharges}
                  subTotal={scanResult.priceBreakdown.subTotal}
                  gst={scanResult.priceBreakdown.gst}
                  finalPrice={scanResult.priceBreakdown.finalPrice}
                  goldCarat={scanResult.extractedData.carat}
                  goldType={scanResult.makingCharges.goldType}
                  certification={scanResult.verificationAnswers?.certificationType}
                />

                <div className="text-center mt-4 space-y-2">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleResetScan}
                    className="gap-2"
                  >
                    <ScanLine className="h-5 w-5" />
                    Scan Another Tag
                  </Button>
                  
                  <div>
                    <Link
                      to="/calculator"
                      className="text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                    >
                      Need manual calculation? Click here
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Show the scanner component directly embedded on the page */
            <div className="space-y-6">
              <JewelleryTagScanner
                onScanComplete={handleScanComplete}
                onClose={handleResetScan}
                embedded={true}
              />
              
              <div className="text-center">
                <Link
                  to="/calculator"
                  className="text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                >
                  Need manual calculation? Click here
                </Link>
              </div>
            </div>
          )}

          {/* Contact Support Box */}
          <div className="mt-8">
            <ContactSupportBox />
          </div>
        </div>
      </div>

      {/* User Verification Modal */}
      <UserVerificationModal />
    </Layout>
  );
}
