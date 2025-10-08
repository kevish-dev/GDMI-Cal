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
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { Link } from "react-router-dom";

interface PriceBreakdown {
  goldValue: number;
  diamondValue: number;
  makingCharges: number;
  finalPrice: number;
}

export default function Home() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const { toast } = useToast();
  const { addCalculation } = useRates();

  const handleScanComplete = async (result: any) => {
    // Set the calculated price breakdown directly
    setPriceBreakdown({
      goldValue: result.priceBreakdown.goldValue,
      diamondValue: result.priceBreakdown.diamondValue,
      makingCharges: result.priceBreakdown.makingCharges,
      finalPrice: result.priceBreakdown.finalPrice,
    });

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
                <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Upload images of your jewelry tag for instant price calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setIsScannerOpen(true)}
                className="w-full gap-2 h-14 sm:h-16 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                <ScanLine className="h-6 w-6" />
                Scan Jewelry Tag
              </Button>

              {/* Link to manual calculation */}
              <div className="text-center">
                <Link
                  to="/calculator"
                  className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                >
                  Need manual calculation? Click here
                </Link>
              </div>

              {/* Show price breakdown if available */}
              {priceBreakdown && (
                <div className="mt-6 space-y-3 p-4 bg-gradient-to-br from-background to-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-center text-lg mb-3">Scanned Price Result</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Gold Value:</span>
                      <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-primary/30 text-primary">
                        ₹{priceBreakdown.goldValue.toLocaleString("en-IN")}
                      </Badge>
                    </div>

                    {priceBreakdown.diamondValue > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Diamond Value:</span>
                        <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-secondary/30 text-secondary">
                          ₹{priceBreakdown.diamondValue.toLocaleString("en-IN")}
                        </Badge>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Making Charges:</span>
                      <Badge variant="outline" className="text-sm px-3 py-1 font-semibold border-primary/30 text-primary">
                        ₹{priceBreakdown.makingCharges.toLocaleString("en-IN")}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-3 mt-4 rounded-lg px-3 bg-gradient-to-r from-emerald-50/90 to-green-50/90 border border-emerald-200/60">
                      <span className="text-base font-bold text-emerald-800">Final Price:</span>
                      <Badge className="text-lg px-4 py-2 font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg">
                        ₹{priceBreakdown.finalPrice.toLocaleString("en-IN")}
                      </Badge>
                    </div>
                  </div>

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
