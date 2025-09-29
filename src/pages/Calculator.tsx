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

type JewelryType = "gold" | "diamond" | null;
type GoldType = "chains" | "plain" | "temple" | "italian";
type Carat = "9k" | "14k" | "18k" | "22k" | "24k";
type DiamondColor = "KL" | "JK" | "IJ" | "HI" | "GH";
type DiamondClarity = "I1-I3" | "SI1" | "SI2" | "VS1" | "VS2" | "VVS1" | "VVS2";
type Certification = "IGI" | "Self" | "None";

interface GoldFormData {
  weight: string;
  carat: Carat | "";
  type: GoldType | "";
}

interface DiamondFormData {
  goldWeight: string;
  carat: Carat | "";
  diamondWeight: string;
  color: DiamondColor | "";
  clarity: DiamondClarity | "";
  certification: Certification | "";
  stoneWeight: string;
}

interface PriceBreakdown {
  goldValue: number;
  diamondValue: number;
  makingCharges: number;
  finalPrice: number;
}

export default function Calculator() {
  const [jewelryType, setJewelryType] = useState<JewelryType>("gold");
  const [goldForm, setGoldForm] = useState<GoldFormData>({
    weight: "",
    carat: "",
    type: "",
  });
  const [diamondForm, setDiamondForm] = useState<DiamondFormData>({
    goldWeight: "",
    carat: "",
    diamondWeight: "",
    color: "",
    clarity: "",
    certification: "",
    stoneWeight: "",
  });
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges, addCalculation } = useRates();

  const handleJewelryTypeSelect = (type: JewelryType) => {
    setJewelryType(type);
    setPriceBreakdown(null);
    // Reset forms when switching types
    if (type !== jewelryType) {
      setGoldForm({ weight: "", carat: "", type: "" });
      setDiamondForm({
        goldWeight: "",
        carat: "",
        diamondWeight: "",
        color: "",
        clarity: "",
        certification: "",
        stoneWeight: "",
      });
    }
  };

  const calculatePrice = async () => {
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

        // Get making charges from admin-managed rates
        const makingChargeRate =
          makingCharges[goldForm.type as keyof typeof makingCharges] || 0;

        goldValue = weight * goldRate;
        calculatedMakingCharges = makingChargeRate * weight; // Making charges per gram
      } else if (jewelryType === "diamond") {
        const goldWeight = parseFloat(diamondForm.goldWeight);
        const diamondWeight = parseFloat(diamondForm.diamondWeight);

        // Get gold rate from admin-managed rates
        const caratKey = diamondForm.carat.toUpperCase();
        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;

        goldValue = goldWeight * goldRate;

        // Get diamond rate from admin-managed rates
        const diamondRate =
          diamondRates.find(
            (rate) =>
              rate.color === diamondForm.color &&
              rate.clarity === diamondForm.clarity &&
              rate.certification === diamondForm.certification
          )?.rate || 50000; // Fallback rate

        diamondValue = diamondWeight * diamondRate;
        calculatedMakingCharges = (goldValue + diamondValue) * 0.12; // 12% making charges for diamond jewelry
      }

      const finalPrice = goldValue + diamondValue + calculatedMakingCharges;

      setPriceBreakdown({
        goldValue,
        diamondValue,
        makingCharges: calculatedMakingCharges,
        finalPrice,
      });

      // Add calculation to analytics
      addCalculation({
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Jewelry Price Calculator
            </h1>
            <p className="text-muted-foreground text-lg">
              Get accurate pricing for gold and diamond jewelry with detailed
              breakdowns
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              {/* Jewelry Type Selection */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gem className="h-5 w-5" />
                    <span>Select Jewelry Type</span>
                  </CardTitle>
                  <CardDescription>
                    Choose the type of jewelry you want to calculate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={jewelryType === "gold" ? "default" : "outline"}
                      className={cn(
                        "h-20 flex-col space-y-2 text-left transition-smooth",
                        jewelryType === "gold" && "gradient-gold shadow-glow"
                      )}
                      onClick={() => handleJewelryTypeSelect("gold")}
                    >
                      <Crown className="h-8 w-8" />
                      <span className="font-medium">Gold Jewelry</span>
                    </Button>

                    <Button
                      variant={
                        jewelryType === "diamond" ? "default" : "outline"
                      }
                      className={cn(
                        "h-20 flex-col space-y-2 text-left transition-smooth",
                        jewelryType === "diamond" &&
                          "gradient-diamond shadow-glow"
                      )}
                      onClick={() => handleJewelryTypeSelect("diamond")}
                    >
                      <Diamond className="h-8 w-8" />
                      <span className="font-medium">Diamond Jewelry</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Form */}
              {jewelryType && (
                <Card
                  className={cn(
                    "shadow-card transition-smooth animate-fade-in",
                    jewelryType === "gold" ? "jewelry-gold" : "jewelry-diamond"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {jewelryType === "gold" ? (
                        <>
                          <Crown className="h-5 w-5 text-primary" />
                          <span>Gold Jewelry Details</span>
                        </>
                      ) : (
                        <>
                          <Diamond className="h-5 w-5 text-secondary" />
                          <span>Diamond Jewelry Details</span>
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Enter the specifications for accurate pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jewelryType === "gold" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="weight">Gold Weight (g)</Label>
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="carat">carat</Label>
                            <Select
                              value={goldForm.carat}
                              onValueChange={(value) =>
                                setGoldForm({
                                  ...goldForm,
                                  carat: value as Carat,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select carat" />
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
                          <Label htmlFor="type">Gold Type</Label>
                          <Select
                            value={goldForm.type}
                            onValueChange={(value) =>
                              setGoldForm({
                                ...goldForm,
                                type: value as GoldType,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gold type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chains">Chains</SelectItem>
                              <SelectItem value="plain">Plain</SelectItem>
                              <SelectItem value="temple">Temple</SelectItem>
                              <SelectItem value="italian">
                                Italian Gold
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="goldWeight">Gold Weight (g)</Label>
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="diamondcarat">carat</Label>
                            <Select
                              value={diamondForm.carat}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  carat: value as Carat,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select carat" />
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="diamondWeight">
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="color">Diamond Color</Label>
                            <Select
                              value={diamondForm.color}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  color: value as DiamondColor,
                                })
                              }
                            >
                              <SelectTrigger>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clarity">Diamond Clarity</Label>
                            <Select
                              value={diamondForm.clarity}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  clarity: value as DiamondClarity,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select clarity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="I1-I3">I1-I3</SelectItem>
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
                            <Label htmlFor="certification">Certification</Label>
                            <Select
                              value={diamondForm.certification}
                              onValueChange={(value) =>
                                setDiamondForm({
                                  ...diamondForm,
                                  certification: value as Certification,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select certification" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Self">Self</SelectItem>
                                <SelectItem value="IGI">IGI</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stoneWeight">
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
                          />
                        </div>
                      </>
                    )}

                    <Button
                      onClick={calculatePrice}
                      disabled={!isFormValid() || isCalculating}
                      className="w-full gradient-gold hover-glow text-base py-6 mt-6"
                    >
                      {isCalculating ? "Calculating..." : "Calculate Price"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {priceBreakdown ? (
                <Card className="shadow-elegant animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IndianRupee className="h-5 w-5" />
                      <span>Price Breakdown</span>
                    </CardTitle>
                    <CardDescription>
                      Detailed calculation of your jewelry price
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Gold Value:
                        </span>
                        <Badge
                          variant="outline"
                          className="text-base px-3 py-1"
                        >
                          ₹{priceBreakdown.goldValue.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      {priceBreakdown.diamondValue > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Diamond Value:
                          </span>
                          <Badge
                            variant="outline"
                            className="text-base px-3 py-1"
                          >
                            ₹
                            {priceBreakdown.diamondValue.toLocaleString(
                              "en-IN"
                            )}
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Making Charges:
                        </span>
                        <Badge
                          variant="outline"
                          className="text-base px-3 py-1"
                        >
                          ₹
                          {priceBreakdown.makingCharges.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          Final Price:
                        </span>
                        <Badge className="text-xl px-4 py-2 gradient-gold">
                          ₹{priceBreakdown.finalPrice.toLocaleString("en-IN")}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t text-center">
                      <p className="text-sm text-muted-foreground">
                        Price calculated based on current market rates
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-card border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Gem className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No calculation yet
                    </h3>
                    <p className="text-muted-foreground">
                      Select jewelry type and enter details to calculate pricing
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
