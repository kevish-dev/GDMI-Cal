import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/Layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Crown, Diamond, Gem, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { useUserVerification } from "@/contexts/UserVerificationContext";
import { UserVerificationModal } from "@/components/UserVerificationModal";

type JewelryType = "gold" | "diamond" | null;
type GoldType = "chains" | "plain" | "temple" | "italian";
type Carat = "9k" | "14k" | "18k" | "22k" | "24k";
type DiamondColor = "KL" | "JK" | "IJ" | "HI" | "GH";
type DiamondClarity = "I1/I2/I3" | "SI1" | "SI2" | "VS1" | "VS2" | "VVS1" | "VVS2";
type Certification = "IGI" | "Self";

interface GoldFormData {
  weight: string;
  carat: Carat | "";
  type: GoldType | "";
  jewellerQuote: string;
}

interface DiamondFormData {
  goldWeight: string;
  carat: Carat | "";
  diamondWeight: string;
  color: DiamondColor | "";
  clarity: DiamondClarity | "";
  certification: Certification | "";
  stoneWeight: string;
  jewellerQuote: string;
}

interface PriceBreakdown {
  goldValue: number;
  diamondValue: number;
  makingCharges: number;
  finalPrice: number;
  jewellerQuote?: number;
  priceDifference?: number;
}

export default function Calculator() {
  const [jewelryType, setJewelryType] = useState<JewelryType>(null);
  const [goldForm, setGoldForm] = useState<GoldFormData>({
    weight: "",
    carat: "",
    type: "",
    jewellerQuote: "",
  });
  const [diamondForm, setDiamondForm] = useState<DiamondFormData>({
    goldWeight: "",
    carat: "",
    diamondWeight: "",
    color: "",
    clarity: "",
    certification: "",
    stoneWeight: "",
    jewellerQuote: "",
  });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges, addCalculation, loading } = useRates();
  const { isVerifiedUser, openVerificationModal } = useUserVerification();

  const handleJewelryTypeSelect = (type: JewelryType) => {
    setJewelryType(type);
    setPriceBreakdown(null);
    // Reset forms when switching types
    if (type !== jewelryType) {
      setGoldForm({ weight: "", carat: "", type: "", jewellerQuote: "" });
      setDiamondForm({
        goldWeight: "",
        carat: "",
        diamondWeight: "",
        color: "",
        clarity: "",
        certification: "",
        stoneWeight: "",
        jewellerQuote: "",
      });
    }
  };

  const calculatePrice = async () => {
    // Check if user is verified before allowing calculation
    if (!isVerifiedUser) {
      openVerificationModal();
      return;
    }

    setIsCalculating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let goldValue = 0;
      let diamondValue = 0;
      let calculatedMakingCharges = 0;

      if (jewelryType === "gold") {
        const weight = parseFloat(goldForm.weight);

        // Get gold rate from admin-managed rates
        const caratKey = goldForm.carat.toUpperCase();
        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;

        // Get making charges from admin-managed rates (now as percentages)
        const typeKey = goldForm.type === "italian" ? "italianGold" : goldForm.type;
        const makingChargePercentage =
          makingCharges[typeKey as keyof typeof makingCharges] || 0;

        goldValue = weight * goldRate;
        calculatedMakingCharges = (goldValue * makingChargePercentage) / 100; // Percentage of gold value
      } else if (jewelryType === "diamond") {
        const goldWeight = parseFloat(diamondForm.goldWeight);
        const diamondWeight = parseFloat(diamondForm.diamondWeight);

        // Get gold rate from admin-managed rates
        const caratKey = diamondForm.carat.toUpperCase();
        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;

        goldValue = goldWeight * goldRate;

        // Get diamond rate from admin-managed rates
        const matchingRate = diamondRates.find(
          (rate) =>
            rate.color === diamondForm.color &&
            rate.clarity === diamondForm.clarity &&
            rate.certification === diamondForm.certification
        );
        
        const diamondRate = matchingRate?.rate || 50000; // Fallback rate
        
        // Log for debugging if no matching rate found
        if (!matchingRate) {
          console.warn(`No diamond rate found for: ${diamondForm.color}-${diamondForm.clarity}-${diamondForm.certification}. Using fallback rate.`);
          console.log('Available rates:', diamondRates.map(r => `${r.color}-${r.clarity}-${r.certification}`));
        }

        diamondValue = diamondWeight * diamondRate;
        calculatedMakingCharges = 800 * goldWeight; // ₹800 per gram of gold weight
      }

      const finalPrice = goldValue + diamondValue + calculatedMakingCharges;

      // Get jeweller quote if provided
      const jewellerQuoteValue = 
        jewelryType === "gold" 
          ? parseFloat(goldForm.jewellerQuote) || 0
          : parseFloat(diamondForm.jewellerQuote) || 0;

      const priceDifference = jewellerQuoteValue > 0 ? finalPrice - jewellerQuoteValue : undefined;

      setPriceBreakdown({
        goldValue,
        diamondValue,
        makingCharges: calculatedMakingCharges,
        finalPrice,
        jewellerQuote: jewellerQuoteValue > 0 ? jewellerQuoteValue : undefined,
        priceDifference,
      });

      // Add calculation to analytics
      await addCalculation({
        type: jewelryType as "gold" | "diamond",
        totalValue: finalPrice,
        goldWeight:
          jewelryType === "gold"
            ? parseFloat(goldForm.weight)
            : parseFloat(diamondForm.goldWeight),
        diamondWeight:
          jewelryType === "diamond"
            ? parseFloat(diamondForm.diamondWeight)
            : undefined,
        carat: jewelryType === "gold" ? goldForm.carat : diamondForm.carat,
        jewelryType: jewelryType === "gold" ? goldForm.type : "diamond",
        jewellerQuote: jewellerQuoteValue > 0 ? jewellerQuoteValue : undefined,
        priceDifference: priceDifference,
      });

      toast({
        title: "Calculation complete!",
        description: "Your jewelry price has been calculated successfully.",
      });
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const isFormValid = () => {
    if (jewelryType === "gold") {
      return goldForm.weight && goldForm.carat && goldForm.type;
    } else if (jewelryType === "diamond") {
      return (
        diamondForm.goldWeight &&
        diamondForm.carat &&
        diamondForm.diamondWeight &&
        diamondForm.color &&
        diamondForm.clarity &&
        diamondForm.certification
      );
    }
    return false;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-2 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-lg text-muted-foreground">Loading jewelry rates...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile optimized */}

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Input Panel */}
            <div className="space-y-4 sm:space-y-6">
              {/* Jewelry Type Selection */}
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Gem className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                      jewelryType === "gold" ? "text-primary" : 
                      jewelryType === "diamond" ? "text-secondary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "transition-colors",
                      jewelryType === "gold" ? "text-primary" : 
                      jewelryType === "diamond" ? "text-secondary" : ""
                    )}>Select Jewelry Type</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Choose the type of jewelry to calculate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      variant={jewelryType === "gold" ? "default" : "outline"}
                      className={cn(
                        "h-16 sm:h-20 flex-col space-y-2 text-left transition-smooth",
                        jewelryType === "gold" && "gradient-gold shadow-glow"
                      )}
                      onClick={() => handleJewelryTypeSelect("gold")}
                    >
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8" />
                      <span className="font-medium text-sm sm:text-base">Gold Jewelry</span>
                    </Button>

                    <Button
                      variant={
                        jewelryType === "diamond" ? "default" : "outline"
                      }
                      className={cn(
                        "h-16 sm:h-20 flex-col space-y-2 text-left transition-smooth",
                        jewelryType === "diamond" &&
                          "gradient-diamond shadow-glow"
                      )}
                      onClick={() => handleJewelryTypeSelect("diamond")}
                    >
                      <Diamond className="h-6 w-6 sm:h-8 sm:w-8" />
                      <span className="font-medium text-sm sm:text-base">Diamond Jewelry</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Form - Mobile optimized */}
              {jewelryType && (
                <Card
                  className={cn(
                    "shadow-card transition-smooth animate-fade-in border-2",
                    jewelryType === "gold" 
                      ? "border-primary/20 bg-gradient-to-br from-background via-background to-primary/5" 
                      : "border-secondary/20 bg-gradient-to-br from-background via-background to-secondary/5"
                  )}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                      {jewelryType === "gold" ? (
                        <>
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <span className="text-primary">Gold Jewelry Details</span>
                        </>
                      ) : (
                        <>
                          <Diamond className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                          <span className="text-secondary">Diamond Jewelry Details</span>
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Enter the specifications for accurate pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jewelryType === "gold" ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight" className="text-sm font-medium">Gold Weight (g)</Label>
                            <Input
                              id="weight"
                              type="number"
                              placeholder="0.00"
                              value={goldForm.weight}
                              onChange={(e) =>
                                setGoldForm({
                                  ...goldForm,
                                  weight: e.target.value,
                                })
                              }
                              className="h-11 text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carat" className="text-sm font-medium">Purity</Label>
                            <Select
                              value={goldForm.carat}
                              onValueChange={(value) =>
                                setGoldForm({
                                  ...goldForm,
                                  carat: value as Carat,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="22K / 18K / 14K"/>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24k">24K</SelectItem>
                                <SelectItem value="22k">22K</SelectItem>
                                <SelectItem value="18k">18K</SelectItem>
                                <SelectItem value="14k">14K</SelectItem>
                                <SelectItem value="9k">9K</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">Jewellery Type</Label>
                          <Select
                            value={goldForm.type}
                            onValueChange={(value) =>
                              setGoldForm({
                                ...goldForm,
                                type: value as GoldType,
                              })
                            }
                          >
                            <SelectTrigger className="h-11 text-base">
                              <SelectValue placeholder="Chains / Plain / Temple / Italian" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chains">Chains {"(2% making charges)"}</SelectItem>
                              <SelectItem value="plain">Plain {"(3.5% making charges)"}</SelectItem>
                              <SelectItem value="temple">Temple {"(7% making charges)"}</SelectItem>
                              <SelectItem value="italian">
                                Italian Gold {"(18% making charges)"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="goldJewellerQuote" className="text-sm font-medium">
                            Price Quoted by Your Jeweller (Optional)
                          </Label>
                          <Input
                            id="goldJewellerQuote"
                            type="number"
                            placeholder="₹ 0"
                            value={goldForm.jewellerQuote}
                            onChange={(e) =>
                              setGoldForm({
                                ...goldForm,
                                jewellerQuote: e.target.value,
                              })
                            }
                            className="h-11 text-base"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="goldWeight" className="text-sm font-medium">Gold Weight (g)</Label>
                            <Input
                              id="goldWeight"
                              type="number"
                              placeholder="0.00"
                              value={diamondForm.goldWeight}
                              onChange={(e) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  goldWeight: e.target.value,
                                })
                              }
                              className="h-11 text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="diamondcarat" className="text-sm font-medium">Purity</Label>
                            <Select
                              value={diamondForm.carat}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  carat: value as Carat,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="22K / 18K / 14K" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24k">24K</SelectItem>
                                <SelectItem value="22k">22K</SelectItem>
                                <SelectItem value="18k">18K</SelectItem>
                                <SelectItem value="14k">14K</SelectItem>
                                <SelectItem value="9k">9K</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="diamondWeight" className="text-sm font-medium">
                              Diamond Weight (ct)
                            </Label>
                            <Input
                              id="diamondWeight"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={diamondForm.diamondWeight}
                              onChange={(e) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  diamondWeight: e.target.value,
                                })
                              }
                              className="h-11 text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="certification" className="text-sm font-medium">Certification</Label>
                            <Select
                              value={diamondForm.certification}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  certification: value as Certification,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="Select certification" />
                              </SelectTrigger>
                              <SelectContent>

                                <SelectItem value="IGI">IGI certified</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clarity" className="text-sm font-medium">Diamond Clarity (optional)</Label>
                            <Select
                              value={diamondForm.clarity}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  clarity: value as DiamondClarity,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="Select clarity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="I1/I2/I3">I1/I2/I3</SelectItem>
                                <SelectItem value="SI1">SI1</SelectItem>
                                <SelectItem value="SI2">SI2</SelectItem>
                                <SelectItem value="VS1">VS1</SelectItem>
                                <SelectItem value="VS2">VS2</SelectItem>
                                <SelectItem value="VVS1">VVS1</SelectItem>
                                <SelectItem value="VVS2">VVS2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color" className="text-sm font-medium">Diamond Color (optional)</Label>
                            <Select
                              value={diamondForm.color}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  color: value as DiamondColor,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-base">
                                <SelectValue placeholder="Select color" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="KL">KL</SelectItem>
                                <SelectItem value="JK">JK</SelectItem>
                                <SelectItem value="IJ">IJ</SelectItem>
                                <SelectItem value="HI">HI</SelectItem>
                                <SelectItem value="GH">GH</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stoneWeight" className="text-sm font-medium">
                            Optional Stone Weight (g)
                          </Label>
                          <Input
                            id="stoneWeight"
                            type="number"
                            placeholder="0.00 (optional)"
                            value={diamondForm.stoneWeight}
                            onChange={(e) =>
                              setDiamondForm({
                                ...diamondForm,
                                stoneWeight: e.target.value,
                              })
                            }
                            className="h-11 text-base"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="diamondJewellerQuote" className="text-sm font-medium">
                            Price Quoted by Your Jeweller (Optional)
                          </Label>
                          <Input
                            id="diamondJewellerQuote"
                            type="number"
                            placeholder="₹ 0"
                            value={diamondForm.jewellerQuote}
                            onChange={(e) =>
                              setDiamondForm({
                                ...diamondForm,
                                jewellerQuote: e.target.value,
                              })
                            }
                            className="h-11 text-base"
                          />
                        </div>
                      </>
                    )}

                    <Button
                      onClick={calculatePrice}
                      disabled={!isFormValid() || isCalculating}
                      className={cn(
                        "w-full hover-glow text-base h-12 sm:h-14 mt-6 font-semibold transition-smooth",
                        jewelryType === "gold" ? "gradient-gold" : "gradient-diamond"
                      )}
                    >
                      {isCalculating ? "Calculating..." : "Calculate Price"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Results Panel - Mobile optimized */}
            <div className="space-y-4 sm:space-y-6">
              {priceBreakdown ? (
                <Card className={cn(
                  "shadow-elegant animate-fade-in border-2",
                  jewelryType === "gold" 
                    ? "border-primary/30 bg-gradient-to-br from-background via-background to-primary/10" 
                    : "border-secondary/30 bg-gradient-to-br from-background via-background to-secondary/10"
                )}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                      {jewelryType === "gold" ? (
                        <Crown className={cn("h-4 w-4 sm:h-5 sm:w-5 text-primary")} />
                      ) : (
                        <Diamond className={cn("h-4 w-4 sm:h-5 sm:w-5 text-secondary")} />
                      )}
                      <span className={cn(
                        jewelryType === "gold" ? "text-primary" : "text-secondary"
                      )}>Price Breakdown</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-black">
                      Detailed calculation of your {jewelryType} jewelry price
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm sm:text-base text-muted-foreground flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span className="text-black">Gold Value:</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="text-sm sm:text-base px-2 sm:px-3 py-1 font-semibold border-primary/30 text-primary"
                        >
                          ₹{priceBreakdown.goldValue.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      {priceBreakdown.diamondValue > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm sm:text-base text-muted-foreground flex items-center space-x-2">
                            <Diamond className="h-4 w-4 text-secondary" />
                            <span className="text-black">Diamond Value:</span>
                          </span>
                          <Badge
                            variant="outline"
                            className="text-sm sm:text-base px-2 sm:px-3 py-1 font-semibold border-secondary/30 text-secondary"
                          >
                            ₹{priceBreakdown.diamondValue.toLocaleString("en-IN")}
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm sm:text-base text-muted-foreground flex items-center space-x-2">
                          <Gem className={cn(
                            "h-4 w-4",
                            jewelryType === "gold" ? "text-primary" : "text-secondary"
                          )} />
                          <span className="text-black">Making Charges:</span>
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-sm sm:text-base px-2 sm:px-3 py-1 font-semibold",
                            jewelryType === "gold" 
                              ? "border-primary/30 text-primary" 
                              : "border-secondary/30 text-secondary"
                          )}
                        >
                          ₹{priceBreakdown.makingCharges.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      <Separator className="my-4" />

                      <div className={cn(
                        "flex justify-between items-center py-3 rounded-lg px-3",
                        jewelryType === "gold" 
                          ? "bg-primary/10 border border-primary/20" 
                          : "bg-secondary/10 border border-secondary/20"
                      )}>
                        <span className={cn(
                          "text-base sm:text-lg font-bold",
                          jewelryType === "gold" ? "text-primary" : "text-secondary"
                        )}>
                          Final Price:
                        </span>
                        <Badge className={cn(
                          "text-lg sm:text-xl px-3 sm:px-4 py-2 font-bold",
                          jewelryType === "gold" ? "gradient-gold" : "gradient-diamond"
                        )}>
                          ₹{priceBreakdown.finalPrice.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      {/* Jeweller Quote Comparison - Mobile optimized */}
                      {priceBreakdown.jewellerQuote && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-3 bg-muted/50 p-3 sm:p-4 rounded-lg">
                            <h4 className="font-medium text-center text-sm sm:text-base">Price Comparison</h4>
                            
                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                Your Jeweller's Quote:
                              </span>
                              <Badge variant="outline" className="text-sm px-2 py-1 font-semibold">
                                ₹{priceBreakdown.jewellerQuote.toLocaleString("en-IN")}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center py-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                Price Difference:
                              </span>
                              <Badge 
                                variant={priceBreakdown.priceDifference! > 0 ? "destructive" : "default"}
                                className="text-sm px-2 py-1 font-semibold"
                              >
                                {priceBreakdown.priceDifference! > 0 ? "+" : ""}
                                ₹{Math.abs(priceBreakdown.priceDifference!).toLocaleString("en-IN")}
                                {priceBreakdown.priceDifference! > 0 ? " Higher" : " Lower"}
                              </Badge>
                            </div>
                            
                            <div className="text-center text-xs sm:text-sm text-muted-foreground mt-2 p-2 bg-background/50 rounded">
                              {priceBreakdown.priceDifference! > 0 
                                ? "Market price is higher than jeweller's quote" 
                                : "Market price is lower than jeweller's quote"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-3 sm:pt-4 border-t text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Price calculated based on current market rates
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={cn(
                  "shadow-card border-dashed transition-all duration-300",
                  jewelryType === "gold" 
                    ? "border-primary/30 bg-gradient-to-br from-background to-primary/5" 
                    : jewelryType === "diamond"
                    ? "border-secondary/30 bg-gradient-to-br from-background to-secondary/5"
                    : "border-muted-foreground/30"
                )}>
                  <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                    {jewelryType === "gold" ? (
                      <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-primary/60 mb-3 sm:mb-4" />
                    ) : jewelryType === "diamond" ? (
                      <Diamond className="h-10 w-10 sm:h-12 sm:w-12 text-secondary/60 mb-3 sm:mb-4" />
                    ) : (
                      <Gem className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    )}
                    <h3 className={cn(
                      "text-base sm:text-lg font-semibold mb-2",
                      jewelryType === "gold" ? "text-primary" : 
                      jewelryType === "diamond" ? "text-secondary" : ""
                    )}>
                      {jewelryType ? `Ready to calculate ${jewelryType} jewelry` : "No calculation yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {jewelryType 
                        ? "Enter the details above and click calculate to get pricing" 
                        : "Select jewelry type and enter details to calculate pricing"
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* User Verification Modal */}
      <UserVerificationModal />
    </Layout>
  );
}
