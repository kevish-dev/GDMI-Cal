import { useState } from "react";
import { Layout } from "@/components/Layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanLine } from "lucide-react";
import { JewelryTagScanner } from "@/components/JewelryTagScanner";
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
  makingChargeRate: number | string;
  makingCharges: number;
  subTotal: number;
  gst: number;
  finalPrice: number;
}

interface ScanResultData {
  jewelryType: "gold" | "diamond";
  extractedData: any;
  verificationAnswers: any;
  makingCharges: any;
  calculatedPrice: number;
  priceBreakdown: PriceBreakdown;
}

export default function Home() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const { toast } = useToast();
  const { addCalculation } = useRates();

  const handleScanComplete = async (result: any) => {
    // Store the complete scan result
    setScanResult(result);

    // Add calculation to analytics
    await addCalculation({
      type: result.jewelryType as "gold" | "diamond",
      totalValue: result.calculatedPrice,
      goldWeight: result.extractedData.weight || result.extractedData.netWeight || 0,
      diamondWeight: result.extractedData.diamondWeight,
      carat: result.extractedData.carat?.toLowerCase(),
      jewelryType: result.jewelryType === "gold" ? result.extractedData.type : "diamond",
      diamondColor: result.extractedData.color,
      diamondClarity: result.extractedData.clarity,
      certification: result.verificationAnswers?.certificationType,
    });

    toast({
      title: "Scan completed successfully!",
      description: `Price calculated: ₹${result.calculatedPrice.toLocaleString("en-IN")}`,
    });
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
              Quick Jewelry Price Check
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Scan your jewelry tag and get instant accurate pricing in seconds
            </p>
          </div>

          {/* Quick Scan Card */}
          <Card className="shadow-card border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-xl sm:text-2xl">
                <ScanLine className="h-6 w-6 text-primary animate-pulse" />
                <span className="text-primary">Quick Scan</span>
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Upload images of your jewelry tag for instant price calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setIsScannerOpen(true)}
                className="w-full gap-2 h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg"
              >
                <ScanLine className="h-6 w-6" />
                Scan Jewelry Tag
              </Button>

              {/* Link to manual calculation */}
              <div className="text-center">
                <Link
                  to="/calculator"
                  className="text-sm text-primary underline underline-offset-4 transition-colors"
                >
                  Need manual calculation? Click here
                </Link>
              </div>

              {/* Show price breakdown if available */}
              {scanResult && (
                <div className="mt-6">
                  <h3 className="font-semibold text-center text-lg mb-4">Scanned Price Result</h3>
                  
                  <PriceBreakdownCard
                    jewelryType={scanResult.jewelryType}
                    goldRate={scanResult.priceBreakdown.goldRate}
                    goldWeight={scanResult.priceBreakdown.goldWeight}
                    goldValue={scanResult.priceBreakdown.goldValue}
                    diamondRate={scanResult.priceBreakdown.diamondRate}
                    diamondWeight={scanResult.priceBreakdown.diamondWeight}
                    diamondValue={scanResult.priceBreakdown.diamondValue}
                    makingChargeRate={scanResult.priceBreakdown.makingChargeRate}
                    makingCharges={scanResult.priceBreakdown.makingCharges}
                    subTotal={scanResult.priceBreakdown.subTotal}
                    gst={scanResult.priceBreakdown.gst}
                    finalPrice={scanResult.priceBreakdown.finalPrice}
                    goldCarat={scanResult.extractedData.carat}
                    goldType={scanResult.makingCharges.goldType}
                    certification={scanResult.verificationAnswers?.certificationType}
                  />

                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScannerOpen(true)}
                      className="gap-2"
                    >
                      <ScanLine className="h-4 w-4" />
                      Scan Another Tag
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                Our advanced AI technology extracts all jewelry details from your tag photos 
                and calculates accurate market prices based on current rates
              </p>
            </CardContent>
          </Card>

          {/* Contact Support Box */}
          <div className="mt-8">
            <ContactSupportBox />
          </div>
        </div>
      </div>

      {/* User Verification Modal */}
      <UserVerificationModal />

      {/* Jewelry Tag Scanner Modal */}
      {isScannerOpen && (
        <JewelryTagScanner
          onScanComplete={handleScanComplete}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </Layout>
  );
}
