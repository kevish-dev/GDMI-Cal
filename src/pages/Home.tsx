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
  diamondColor?: string;
  diamondClarity?: string;
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
      description: `Price calculated: ${result.calculatedPrice.toLocaleString("en-IN")}`,
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
          <Card className="shadow-card border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-xl sm:text-2xl">
                <ScanLine className="h-6 w-6 text-primary animate-pulse" />
                <span className="text-primary">Quick Scan</span>
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Scan your jewelry tag - Results in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show Quick Scan UI only if no result yet */}
              {!scanResult && (
                <>
                  {/* Scanning Frame Visual */}
                  <div className="relative group">
                    {/* Main Scanning Area */}
                    <div 
                      onClick={() => setIsScannerOpen(true)}
                      className="relative w-full aspect-[4/3] bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-dashed border-primary/40 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
                    >
                      {/* Animated Scanning Line */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>

                      {/* Corner Brackets - Scanning Frame */}
                      <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                      {/* Center Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6">
                        {/* Scan Icon with Pulse Effect */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                          <div className="relative bg-primary/10 p-6 rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors">
                            <ScanLine className="h-12 w-12 text-primary animate-pulse" />
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-2">
                          <h3 className="text-lg font-bold text-primary">
                            Tap to Scan Jewelry Tag
                          </h3>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="font-medium">Ready</span>
                            </div>
                            <span>•</span>
                            <span>Results in seconds</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Info Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground shadow-lg px-4 py-1 text-xs font-semibold">
                        ⚡ Instant Results
                      </Badge>
                    </div>
                  </div>

                  {/* Link to manual calculation */}
                  <div className="text-center pt-2">
                    <Link
                      to="/calculator"
                      className="text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                    >
                      Need manual calculation? Click here
                    </Link>
                  </div>
                </>
              )}

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
