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
                  stoneWeight={scanResult.priceBreakdown.stoneWeight}
                  stoneValue={scanResult.priceBreakdown.stoneValue}
                  kundanWeight={scanResult.priceBreakdown.kundanWeight}
                  kundanValue={scanResult.priceBreakdown.kundanValue}
                  makingChargeRate={scanResult.priceBreakdown.makingChargeRate}
                  makingCharges={scanResult.priceBreakdown.makingCharges}
                  subTotal={scanResult.priceBreakdown.subTotal}
                  gst={scanResult.priceBreakdown.gst}
                  finalPrice={scanResult.priceBreakdown.finalPrice}
                  goldCarat={scanResult.extractedData.carat}
                  goldType={scanResult.makingCharges.goldType}
                  certification={scanResult.verificationAnswers?.certificationType}
                  extractedData={{
                    itemCode: scanResult.extractedData.itemCode,
                    grossWeight: scanResult.extractedData.grossWeight,
                    netWeight: scanResult.extractedData.netWeight,
                    huid: scanResult.extractedData.huid,
                    hallmark: scanResult.extractedData.hallmark,
                    type: scanResult.extractedData.type,
                    diameter: scanResult.extractedData.diameter,
                    purity: scanResult.extractedData.purity,
                  }}
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
