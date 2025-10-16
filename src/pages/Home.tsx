import { useState } from "react";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/ui/button";
import { ScanLine, Phone, MessageCircle, ImageUp, Package, BadgeIndianRupee } from "lucide-react";
import { JewelleryTagScanner } from "@/components/JewelryTagScanner";
import { GoldRateMarquee } from "@/components/GoldRateMarquee";
import { UserVerificationModal } from "@/components/UserVerificationModal";
import { PriceBreakdownCard } from "@/components/PriceBreakdownCard";
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { Link, useNavigate } from "react-router-dom";

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
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const { addCalculation } = useRates();
  const navigate = useNavigate();

  const handleScanComplete = async (result: any) => {
    // Store the complete scan result
    setScanResult(result);
    setShowScanner(false);

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
      description: `Price calculated: ₹${result.calculatedPrice.toLocaleString("en-IN")}`,
    });
  };

  const handleResetScan = () => {
    setScanResult(null);
    setShowScanner(false);
  };

  const handleCallNow = () => {
    window.open("tel:+919971187600", "_self");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hi, I need help with jewellery price calculation.");
    window.open(`https://wa.me/919971187600?text=${message}`, "_blank");
  };

  if (showScanner) {
    return (
      <Layout>
        <GoldRateMarquee />
        <div className="container mx-auto px-3 sm:px-4 py-8">
          <JewelleryTagScanner
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
            embedded={true}
          />
        </div>
        <UserVerificationModal />
      </Layout>
    );
  }

  if (scanResult) {
    return (
      <Layout>
        <GoldRateMarquee />
        <div className="container mx-auto px-3 sm:px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
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

            <div className="text-center mt-6 space-y-3">
              <Button
                variant="default"
                size="lg"
                onClick={handleResetScan}
                className="gap-2 w-full sm:w-auto"
              >
                <ScanLine className="h-5 w-5" />
                Scan Another Tag
              </Button>
            </div>
          </div>
        </div>
        <UserVerificationModal />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Live Gold Rate Marquee */}
      <GoldRateMarquee />

      {/* Hero Section */}
      <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center px-3 sm:px-4 py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left space-y-6 sm:space-y-8 mb-12 sm:mb-16">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight px-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <span className="block text-foreground">Save Lakhs, know</span>
              <span className="block text-foreground">the actual price of</span>
              <span className="block text-foreground">any jewellery.</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              Snap. Scan. See what it's worth. Our smart calculator instantly reads your tag and reveals your jewellery's true value.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 pt-4">
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                className="w-full sm:w-auto bg-[#907F58] hover:bg-[#6D5A42] text-white px-8 py-6 text-base sm:text-lg rounded-lg shadow-lg transition-all"
              >
                Scan Tag and know
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/calculator')}
                className="w-full sm:w-auto border-2 border-[#907F58] text-[#907F58] hover:bg-[#907F58] hover:text-white px-8 py-6 text-base sm:text-lg rounded-lg transition-all"
              >
                Enter Manually
              </Button>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="bg-gradient-to-b from-[#E8DED1] to-[#D4C4B0] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-12 text-foreground">
              How it works
            </h2>

            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
              {/* Step 1 */}
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 uppercase tracking-wide">
                    Scan Tag
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Upload the front and back of your jewellery tag.
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              <div className="ml-6 sm:ml-7 w-px h-8 sm:h-12 bg-[#907F58]/30"></div>

              {/* Step 2 */}
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 uppercase tracking-wide">
                    Select Jewellery Type
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Pick your jewellery type to get accurate making charges.
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              <div className="ml-6 sm:ml-7 w-px h-8 sm:h-12 bg-[#907F58]/30"></div>

              {/* Step 3 */}
              <div className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 uppercase tracking-wide">
                    Get Actual Price
                  </h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    View your true price based on live gold and diamond rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Contact Buttons */}
        <div className="fixed right-4 sm:right-6 bottom-20 sm:bottom-24 z-50 flex flex-col gap-3">
          {/* Phone Button */}
          <button
            onClick={handleCallNow}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#907F58] hover:bg-[#6D5A42] text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
            aria-label="Call now"
          >
            <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsApp}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
            aria-label="WhatsApp us"
          >
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </div>
      </div>

      {/* User Verification Modal */}
      <UserVerificationModal />
    </Layout>
  );
}
