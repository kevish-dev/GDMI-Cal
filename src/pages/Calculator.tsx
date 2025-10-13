import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
import { RadioButtonGroup } from "@/components/ui/radio-button-group";
import { Crown, Diamond, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { useUserVerification } from "@/contexts/UserVerificationContext";
import { UserVerificationModal } from "@/components/UserVerificationModal";
import { LiveGoldRateIndicator } from "@/components/LiveGoldRateIndicator";
import { GoldRateMarquee } from "@/components/GoldRateMarquee";
import { ContactSupportBox } from "@/components/ContactSupportBox";
import { PriceBreakdownCard } from "@/components/PriceBreakdownCard";

type JewelleryType = "gold" | "diamond" | null;
type GoldType = "chains" | "plain" | "temple" | "italian";
type Carat = "14k" | "18k" | "22k";
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
  discount?: number;
  subtotalAfterDiscount?: number;
  gst: number;
  finalPrice: number;
  jewellerQuote?: number;
  priceDifference?: number;
}

export default function Calculator() {
  const [JewelleryType, setJewelleryType] = useState<JewelleryType>(null);
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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges, addCalculation, loading } = useRates();
  const { isVerifiedUser, openVerificationModal } = useUserVerification();

  const handleJewelleryTypeSelect = (type: JewelleryType) => {
    setJewelleryType(type);
    setPriceBreakdown(null);
    // Reset forms when switching types
    if (type !== JewelleryType) {
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

    // Validate form and show errors if invalid
    if (!validateForm()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields marked with a red star.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let goldValue = 0;
      let diamondValue = 0;
      let calculatedMakingCharges = 0;
      let goldRate = 0;
      let goldWeightValue = 0;
      let diamondRate = 0;
      let diamondWeightValue = 0;
      let makingChargeRateDisplay: number | string = 0;

      if (JewelleryType === "gold") {
        const weight = parseFloat(goldForm.weight);
        goldWeightValue = weight;

        // Get gold rate from admin-managed rates
        const caratKey = goldForm.carat.toUpperCase();
        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;

        // Get making charges from admin-managed rates (now as percentages)
        const typeKey = goldForm.type === "italian" ? "italianGold" : goldForm.type;
        const makingChargePercentage =
          makingCharges[typeKey as keyof typeof makingCharges] || 0;

        goldValue = weight * goldRate;
        calculatedMakingCharges = (goldValue * makingChargePercentage) / 100; // Percentage of gold value
        makingChargeRateDisplay = makingChargePercentage;
      } else if (JewelleryType === "diamond") {
        const goldWeight = parseFloat(diamondForm.goldWeight);
        const diamondWeight = parseFloat(diamondForm.diamondWeight);
        goldWeightValue = goldWeight;
        diamondWeightValue = diamondWeight;

        // Get gold rate from admin-managed rates
        const caratKey = diamondForm.carat.toUpperCase();
        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;

        goldValue = goldWeight * goldRate;

        // Get diamond rate from admin-managed rates
        // Diamond rate calculation now only depends on certification
        const matchingRate = diamondRates.find(
          (rate) => rate.certification === diamondForm.certification
        );
        
        diamondRate = matchingRate?.rate || 50000; // Fallback rate
        
        // Log for debugging if no matching rate found
        if (!matchingRate) {
          console.warn(`No diamond rate found for certification: ${diamondForm.certification}. Using fallback rate.`);
          console.log('Available certifications:', diamondRates.map(r => r.certification));
        } else {
          console.info(`Using diamond rate for ${diamondForm.certification} certification: ${diamondRate.toLocaleString("en-IN")} per carat.`);
        }

        diamondValue = diamondWeight * diamondRate;
        calculatedMakingCharges = 800 * goldWeight; // 800 per gram of gold weight
        makingChargeRateDisplay = 800;
      }

      const subTotal = goldValue + diamondValue + calculatedMakingCharges;
      const gstAmount = (subTotal * 3) / 100; // 3% GST
      const finalPrice = subTotal + gstAmount;

      // Get jeweller quote if provided
      const jewellerQuoteValue = 
        JewelleryType === "gold" 
          ? parseFloat(goldForm.jewellerQuote) || 0
          : parseFloat(diamondForm.jewellerQuote) || 0;

      const priceDifference = jewellerQuoteValue > 0 ? finalPrice - jewellerQuoteValue : undefined;

      setPriceBreakdown({
        goldRate,
        goldWeight: goldWeightValue,
        goldValue,
        diamondRate: diamondRate > 0 ? diamondRate : undefined,
        diamondWeight: diamondWeightValue > 0 ? diamondWeightValue : undefined,
        diamondValue,
        makingChargeRate: makingChargeRateDisplay,
        makingCharges: calculatedMakingCharges,
        subTotal,
        gst: gstAmount,
        finalPrice,
        jewellerQuote: jewellerQuoteValue > 0 ? jewellerQuoteValue : undefined,
        priceDifference,
      });

      // Add calculation to analytics
      await addCalculation({
        type: JewelleryType as "gold" | "diamond",
        totalValue: finalPrice,
        goldWeight:
          JewelleryType === "gold"
            ? parseFloat(goldForm.weight)
            : parseFloat(diamondForm.goldWeight),
        diamondWeight:
          JewelleryType === "diamond"
            ? parseFloat(diamondForm.diamondWeight)
            : undefined,
        carat: JewelleryType === "gold" ? goldForm.carat : diamondForm.carat,
        JewelleryType: JewelleryType === "gold" ? goldForm.type : "diamond",
        jewellerQuote: jewellerQuoteValue > 0 ? jewellerQuoteValue : undefined,
        priceDifference: priceDifference,
        // Include optional diamond fields for saving to database
        diamondColor: JewelleryType === "diamond" ? diamondForm.color || undefined : undefined,
        diamondClarity: JewelleryType === "diamond" ? diamondForm.clarity || undefined : undefined,
        certification: JewelleryType === "diamond" ? diamondForm.certification || undefined : undefined,
      });

      toast({
        title: "Calculation complete!",
        description: "Your Jewellery price has been calculated successfully.",
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

  const validateForm = () => {
    const errors: {[key: string]: boolean} = {};
    
    if (JewelleryType === "gold") {
      if (!goldForm.weight) errors.weight = true;
      if (!goldForm.carat) errors.carat = true;
      if (!goldForm.type) errors.type = true;
    } else if (JewelleryType === "diamond") {
      if (!diamondForm.goldWeight) errors.goldWeight = true;
      if (!diamondForm.carat) errors.diamondCarat = true;
      if (!diamondForm.diamondWeight) errors.diamondWeight = true;
      if (!diamondForm.certification) errors.certification = true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = () => {
    if (JewelleryType === "gold") {
      return goldForm.weight && goldForm.carat && goldForm.type;
    } else if (JewelleryType === "diamond") {
      return (
        diamondForm.goldWeight &&
        diamondForm.carat &&
        diamondForm.diamondWeight &&
        diamondForm.certification
        // Note: color and clarity are now optional
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
                <p className="text-lg text-muted-foreground">Loading Jewellery rates...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Live Gold Rate Marquee */}
      <GoldRateMarquee />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header - Mobile optimized */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Manual Price Calculator
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Enter Jewellery details manually for accurate pricing calculation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Input Panel */}
            <div className="space-y-4 sm:space-y-6">
              {/* Jewellery Type Selection */}
              <Card className="shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Gem className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                      JewelleryType === "gold" ? "text-primary" : 
                      JewelleryType === "diamond" ? "text-secondary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "transition-colors",
                      JewelleryType === "gold" ? "text-primary" : 
                      JewelleryType === "diamond" ? "text-secondary" : ""
                    )}>Select Jewellery Type</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Choose the type of Jewellery to calculate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div
                      className={cn(
                        "relative h-16 sm:h-20 flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                        JewelleryType === "gold" 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-gray-200 bg-background text-gray-600"
                      )}
                      onClick={() => handleJewelleryTypeSelect("gold")}
                    >
                      {/* Radio button indicator */}
                      <div className={cn(
                        "absolute left-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                        JewelleryType === "gold" 
                          ? "border-primary bg-primary" 
                          : "border-gray-300 bg-white"
                      )}>
                        {JewelleryType === "gold" && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex items-center space-x-3 ml-6">
                        <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="font-medium text-sm sm:text-base">Gold Jewellery</span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "relative h-16 sm:h-20 flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                        JewelleryType === "diamond" 
                          ? "border-secondary bg-secondary/10 text-secondary" 
                          : "border-gray-200 bg-background text-gray-600"
                      )}
                      onClick={() => handleJewelleryTypeSelect("diamond")}
                    >
                      {/* Radio button indicator */}
                      <div className={cn(
                        "absolute left-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                        JewelleryType === "diamond" 
                          ? "border-secondary bg-secondary" 
                          : "border-gray-300 bg-white"
                      )}>
                        {JewelleryType === "diamond" && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex items-center space-x-3 ml-6">
                        <Diamond className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="font-medium text-sm sm:text-base">Diamond Jewellery</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Form - Mobile optimized */}
              {JewelleryType && (
                <Card
                  className={cn(
                    "shadow-card transition-smooth animate-fade-in border-2",
                    JewelleryType === "gold" 
                      ? "border-primary/20 bg-gradient-to-br from-background via-background to-primary/5" 
                      : "border-secondary/20 bg-gradient-to-br from-background via-background to-secondary/5"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                        {JewelleryType === "gold" ? (
                          <>
                            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            <span className="text-primary">Gold Jewellery Details</span>
                          </>
                        ) : (
                          <>
                            <Diamond className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                            <span className="text-secondary">Diamond Jewellery Details</span>
                          </>
                        )}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      Enter the specifications for accurate pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {JewelleryType === "gold" ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight" className="text-sm font-medium">
                              Gold Weight (g) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="weight"
                              type="number"
                              placeholder="0.00"
                              value={goldForm.weight}
                              onChange={(e) => {
                                setGoldForm({
                                  ...goldForm,
                                  weight: e.target.value,
                                });
                                if (validationErrors.weight) {
                                  setValidationErrors(prev => ({...prev, weight: false}));
                                }
                              }}
                              className={cn(
                                "h-11 text-base",
                                validationErrors.weight && "border-red-500 focus:border-red-500"
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carat" className="text-sm font-medium">
                              Purity <span className="text-red-500">*</span>
                            </Label>
                            <RadioButtonGroup
                              value={goldForm.carat}
                              onValueChange={(value) => {
                                setGoldForm({
                                  ...goldForm,
                                  carat: value as Carat,
                                });
                                if (validationErrors.carat) {
                                  setValidationErrors(prev => ({...prev, carat: false}));
                                }
                              }}
                              className={cn(
                                validationErrors.carat && "ring-2 ring-red-500 ring-offset-2 rounded-lg p-1"
                              )}
                              options={[
                                { value: "22k", label: "22K" },
                                { value: "18k", label: "18K" },
                                { value: "14k", label: "14K" }
                              ]}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-sm font-medium">
                            Jewellery Type <span className="text-red-500">*</span>
                          </Label>
                          <RadioButtonGroup
                            value={goldForm.type}
                            onValueChange={(value) => {
                              setGoldForm({
                                ...goldForm,
                                type: value as GoldType,
                              });
                              if (validationErrors.type) {
                                setValidationErrors(prev => ({...prev, type: false}));
                              }
                            }}
                            className={cn(
                              "grid grid-cols-2 gap-2",
                              validationErrors.type && "ring-2 ring-red-500 ring-offset-2 rounded-lg p-1"
                            )}
                            options={[
                              { value: "chains", label: "Chains", description: "(2.5% making charges)" },
                              { value: "plain", label: "Plain", description: "(3.5% making charges)" },
                              { value: "temple", label: "Temple", description: "(7% making charges)" },
                              { value: "italian", label: "Italian Gold", description: "(18% making charges)" }
                            ]}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="goldJewellerQuote" className="text-sm font-medium">
                            Price Quoted by Your Jeweller (Optional)
                          </Label>
                          <Input
                            id="goldJewellerQuote"
                            type="number"
                            placeholder="0"
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
                            <Label htmlFor="goldWeight" className="text-sm font-medium">
                              Gold Weight (g) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="goldWeight"
                              type="number"
                              placeholder="0.00"
                              value={diamondForm.goldWeight}
                              onChange={(e) => {
                                setDiamondForm({
                                  ...diamondForm,
                                  goldWeight: e.target.value,
                                });
                                if (validationErrors.goldWeight) {
                                  setValidationErrors(prev => ({...prev, goldWeight: false}));
                                }
                              }}
                              className={cn(
                                "h-11 text-base",
                                validationErrors.goldWeight && "border-red-500 focus:border-red-500"
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="diamondcarat" className="text-sm font-medium">
                              Purity <span className="text-red-500">*</span>
                            </Label>
                            <RadioButtonGroup
                              value={diamondForm.carat}
                              onValueChange={(value) => {
                                setDiamondForm({
                                  ...diamondForm,
                                  carat: value as Carat,
                                });
                                if (validationErrors.diamondCarat) {
                                  setValidationErrors(prev => ({...prev, diamondCarat: false}));
                                }
                              }}
                              className={cn(
                                validationErrors.diamondCarat && "ring-2 ring-red-500 ring-offset-2 rounded-lg p-1"
                              )}
                              options={[
                                { value: "22k", label: "22K" },
                                { value: "18k", label: "18K" },
                                { value: "14k", label: "14K" }
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="diamondWeight" className="text-sm font-medium">
                              Diamond Weight (ct) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="diamondWeight"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={diamondForm.diamondWeight}
                              onChange={(e) => {
                                setDiamondForm({
                                  ...diamondForm,
                                  diamondWeight: e.target.value,
                                });
                                if (validationErrors.diamondWeight) {
                                  setValidationErrors(prev => ({...prev, diamondWeight: false}));
                                }
                              }}
                              className={cn(
                                "h-11 text-base",
                                validationErrors.diamondWeight && "border-red-500 focus:border-red-500"
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="certification" className="text-sm font-medium">
                              Certification <span className="text-red-500">*</span>
                            </Label>
                            <RadioButtonGroup
                              value={diamondForm.certification}
                              onValueChange={(value) => {
                                setDiamondForm({
                                  ...diamondForm,
                                  certification: value as Certification,
                                });
                                if (validationErrors.certification) {
                                  setValidationErrors(prev => ({...prev, certification: false}));
                                }
                              }}
                              className={cn(
                                "grid grid-cols-1 gap-2",
                                validationErrors.certification && "ring-2 ring-red-500 ring-offset-2 rounded-lg p-1"
                              )}
                              options={[
                                { value: "Self", label: "None/ Other non-IGI certificate" },
                                { value: "IGI", label: "IGI certified" }
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clarity" className="text-sm font-medium">Diamond Clarity (optional)</Label>
                            <RadioButtonGroup
                              value={diamondForm.clarity}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  clarity: value as DiamondClarity,
                                })
                              }
                              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                              options={[
                                { value: "I1/I2/I3", label: "I1/I2/I3" },
                                { value: "SI1", label: "SI1" },
                                { value: "SI2", label: "SI2" },
                                { value: "VS1", label: "VS1" },
                                { value: "VS2", label: "VS2" },
                                { value: "VVS1", label: "VVS1" },
                                { value: "VVS2", label: "VVS2" }
                              ]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color" className="text-sm font-medium">Diamond Color (optional)</Label>
                            <RadioButtonGroup
                              value={diamondForm.color}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  color: value as DiamondColor,
                                })
                              }
                              className="grid grid-cols-3 sm:grid-cols-5 gap-2"
                              options={[
                                { value: "KL", label: "KL" },
                                { value: "JK", label: "JK" },
                                { value: "IJ", label: "IJ" },
                                { value: "HI", label: "HI" },
                                { value: "GH", label: "GH" }
                              ]}
                            />
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
                            placeholder="0"
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
                        JewelleryType === "gold" ? "gradient-gold" : "gradient-diamond"
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
                <PriceBreakdownCard
                  JewelleryType={JewelleryType as "gold" | "diamond"}
                  goldRate={priceBreakdown.goldRate}
                  goldWeight={priceBreakdown.goldWeight}
                  goldValue={priceBreakdown.goldValue}
                  diamondRate={priceBreakdown.diamondRate}
                  diamondWeight={priceBreakdown.diamondWeight}
                  diamondValue={priceBreakdown.diamondValue}
                  makingChargeRate={priceBreakdown.makingChargeRate}
                  makingCharges={priceBreakdown.makingCharges}
                  subTotal={priceBreakdown.subTotal}
                  gst={priceBreakdown.gst}
                  finalPrice={priceBreakdown.finalPrice}
                  jewellerQuote={priceBreakdown.jewellerQuote}
                  priceDifference={priceBreakdown.priceDifference}
                  goldCarat={JewelleryType === "gold" ? goldForm.carat : diamondForm.carat}
                  goldType={JewelleryType === "gold" ? goldForm.type : undefined}
                  certification={JewelleryType === "diamond" ? diamondForm.certification : undefined}
                />
              ) : (
                <Card className={cn(
                  "shadow-card border-dashed transition-all duration-300",
                  JewelleryType === "gold" 
                    ? "border-primary/30 bg-gradient-to-br from-background to-primary/5" 
                    : JewelleryType === "diamond"
                    ? "border-secondary/30 bg-gradient-to-br from-background to-secondary/5"
                    : "border-muted-foreground/30"
                )}>
                  <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                    {JewelleryType === "gold" ? (
                      <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-primary/60 mb-3 sm:mb-4" />
                    ) : JewelleryType === "diamond" ? (
                      <Diamond className="h-10 w-10 sm:h-12 sm:w-12 text-secondary/60 mb-3 sm:mb-4" />
                    ) : (
                      <Gem className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    )}
                    <h3 className={cn(
                      "text-base sm:text-lg font-semibold mb-2",
                      JewelleryType === "gold" ? "text-primary" : 
                      JewelleryType === "diamond" ? "text-secondary" : ""
                    )}>
                      {JewelleryType ? `Ready to calculate ${JewelleryType} Jewellery` : "No calculation yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {JewelleryType 
                        ? "Enter the details above and click calculate to get pricing" 
                        : "Select Jewellery type and enter details to calculate pricing"
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
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
