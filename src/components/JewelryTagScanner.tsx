import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine,
  Camera,
  Upload,
  X,
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Crown,
  Diamond,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromImages } from "@/utils/getText";
import { useRates } from "@/contexts/RatesContext";

type JewelryType = "gold" | "diamond" | null;
type Certification = "IGI" | "Non-IGI";
type GoldType = "chains" | "plain" | "temple" | "italian";

interface ExtractedData {
  weight?: number;
  carat?: string;
  diamondWeight?: number;
  stoneWeight?: number;
  purity?: string;
  itemCode?: string;
  [key: string]: any;
}

interface VerificationAnswers {
  // Gold questions
  buyBackGuarantee?: boolean;
  showsRawForm?: boolean;
  // Diamond questions
  diamondAppreciation?: boolean;
  certificationType?: Certification;
}

interface MakingCharges {
  goldType?: GoldType;
  percentage?: number;
}

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

interface ScanResult {
  jewelryType: JewelryType;
  extractedData: ExtractedData;
  verificationAnswers: VerificationAnswers;
  makingCharges: MakingCharges;
  calculatedPrice: number;
  priceBreakdown: PriceBreakdown;
}

interface JewelryTagScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

export function JewelryTagScanner({
  onScanComplete,
  onClose,
}: JewelryTagScannerProps) {
  const [step, setStep] = useState(1);
  const [jewelryType, setJewelryType] = useState<JewelryType>(null);
  const [images, setImages] = useState<{
    top: File | null;
    bottom: File | null;
  }>({
    top: null,
    bottom: null,
  });
  const [imagePreviews, setImagePreviews] = useState<{
    top: string;
    bottom: string;
  }>({
    top: "",
    bottom: "",
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [verificationAnswers, setVerificationAnswers] =
    useState<VerificationAnswers>({});
  const [makingChargesData, setMakingChargesData] = useState<MakingCharges>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges } = useRates();

  // Auto-set making charges for diamond jewelry when reaching step 2
  useEffect(() => {
    if (step === 2 && jewelryType === "diamond" && !makingChargesData.percentage) {
      setMakingChargesData({ percentage: 800 });
    }
  }, [step, jewelryType, makingChargesData.percentage]);

  const handleImageUpload = (view: "top" | "bottom", file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [view]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      setImages((prev) => ({ ...prev, [view]: file }));
    } else {
      setImages((prev) => ({ ...prev, [view]: null }));
      setImagePreviews((prev) => ({ ...prev, [view]: "" }));
    }
  };

  const handleRemoveImage = (view: "top" | "bottom") => {
    setImages((prev) => ({ ...prev, [view]: null }));
    setImagePreviews((prev) => ({ ...prev, [view]: "" }));
  };

  const handleExtractText = async () => {
    if (!images.top) {
      toast({
        title: "Missing image",
        description: "Please upload at least the top view image",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const data = await extractTextFromImages(
        images.top,
        images.bottom,
        jewelryType!
      );
      setExtractedData(data);
      setStep(4);
      toast({
        title: "Text extracted successfully",
        description:
          "Review the extracted information and answer the questions",
      });
    } catch (error) {
      toast({
        title: "Extraction failed",
        description: "Failed to extract text from images. Please try again.",
        variant: "destructive",
      });
      console.error("OCR Error:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCalculatePreview = async () => {
    if (!jewelryType || !extractedData) return;

    setIsCalculating(true);

    try {
      // Calculate price based on extracted data with making charges
      let goldValue = 0;
      let diamondValue = 0;
      let calculatedMakingCharges = 0;
      let goldRate = 0;
      let goldWeightValue = 0;
      let diamondRate = 0;
      let diamondWeightValue = 0;
      let makingChargeRateDisplay: number | string = 0;

      if (jewelryType === "gold") {
        const weight = extractedData.weight || extractedData.netWeight || 0;
        goldWeightValue = weight;
        const caratKey = extractedData.carat?.toUpperCase();

        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        goldValue = weight * goldRate;
        
        // Calculate making charges as percentage of gold value
        const makingChargePercentage = makingChargesData.percentage || 0;
        calculatedMakingCharges = (goldValue * makingChargePercentage) / 100;
        makingChargeRateDisplay = makingChargePercentage;
      } else if (jewelryType === "diamond") {
        const goldWeight = extractedData.weight || extractedData.netWeight || 0;
        const diamondWeight = extractedData.diamondWeight || 0;
        goldWeightValue = goldWeight;
        diamondWeightValue = diamondWeight;
        const caratKey = extractedData.carat?.toUpperCase();

        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        goldValue = goldWeight * goldRate;

        // Get diamond rate based on certification from verification answers
        const certification =
          verificationAnswers.certificationType === "IGI" ? "IGI" : "Self";
        const matchingRate = diamondRates.find(
          (rate) => rate.certification === certification
        );
        diamondRate = matchingRate?.rate || 50000;

        diamondValue = diamondWeight * diamondRate;
        
        // Calculate making charges as fixed rate per gram
        calculatedMakingCharges = (makingChargesData.percentage || 800) * goldWeight;
        makingChargeRateDisplay = makingChargesData.percentage || 800;
      }

      const subTotal = goldValue + diamondValue + calculatedMakingCharges;
      const finalPrice = subTotal; // No GST - final price is same as subtotal

      const breakdown: PriceBreakdown = {
        goldRate,
        goldWeight: goldWeightValue,
        goldValue,
        diamondRate: diamondRate > 0 ? diamondRate : undefined,
        diamondWeight: diamondWeightValue > 0 ? diamondWeightValue : undefined,
        diamondValue,
        makingChargeRate: makingChargeRateDisplay,
        makingCharges: calculatedMakingCharges,
        subTotal,
        gst: 0, // No GST
        finalPrice,
      };

      setCalculatedPrice(finalPrice);
      setPriceBreakdown(breakdown);
      
      // Complete directly without showing step 5
      const result: ScanResult = {
        jewelryType,
        extractedData,
        verificationAnswers,
        makingCharges: makingChargesData,
        calculatedPrice: breakdown.finalPrice,
        priceBreakdown: breakdown,
      };

      onScanComplete(result);
      onClose();

      toast({
        title: "Scan complete!",
        description: "Jewelry tag scanned and price calculated successfully.",
      });
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Failed to calculate price. Please try again.",
        variant: "destructive",
      });
      console.error("Calculation Error:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const canProceedToStep2 = jewelryType !== null;
  const canProceedToStep3 =
    jewelryType === "gold"
      ? makingChargesData.goldType !== undefined && makingChargesData.percentage !== undefined
      : makingChargesData.percentage !== undefined;
  const canProceedToStep4 = images.top !== null; // Only top image required
  const canCalculate =
    jewelryType === "gold"
      ? verificationAnswers.buyBackGuarantee !== undefined &&
        verificationAnswers.showsRawForm !== undefined
      : verificationAnswers.diamondAppreciation !== undefined &&
        verificationAnswers.certificationType !== undefined;

  const progressPercentage = (step / 4) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="relative border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ScanLine className="h-8 w-8 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  Scan Jewelry Tag
                </CardTitle>
                <CardDescription>Step {step} of 4</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Custom Stepped Progress Bar */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  stepNumber <= step
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Step 1: Select Jewelry Type */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Select Jewelry Type</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the type of jewelry you want to scan
                </p>
              </div>

              <RadioGroup
                value={jewelryType || ""}
                onValueChange={(value) => setJewelryType(value as JewelryType)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="gold"
                    id="scan-gold"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="scan-gold"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 peer-data-[state=checked]:border-primary cursor-pointer transition-all",
                      jewelryType === "gold" && "border-primary bg-primary/5"
                    )}
                  >
                    <Crown className="h-10 w-10 mb-3 text-primary" />
                    <span className="text-base font-semibold">Gold</span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem
                    value="diamond"
                    id="scan-diamond"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="scan-diamond"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 peer-data-[state=checked]:border-secondary cursor-pointer transition-all",
                      jewelryType === "diamond" &&
                        "border-secondary bg-secondary/5"
                    )}
                  >
                    <Diamond className="h-10 w-10 mb-3 text-secondary" />
                    <span className="text-base font-semibold">Diamond</span>
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Making Charges */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Making Charges</h3>
                <p className="text-sm text-muted-foreground">
                  Select jewelry type and making charge percentage
                </p>
              </div>

              {jewelryType === "gold" ? (
                <div className="space-y-4">
                  {/* Gold Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Select Jewelry Type
                    </Label>
                    <RadioGroup
                      value={makingChargesData.goldType || ""}
                      onValueChange={(value) =>
                        setMakingChargesData((prev) => ({
                          ...prev,
                          goldType: value as GoldType,
                          percentage: {
                            chains: makingCharges.chains || 2,
                            plain: makingCharges.plain || 3.5,
                            temple: makingCharges.temple || 7,
                            italian: makingCharges.italianGold || 18,
                          }[value as GoldType],
                        }))
                      }
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <Label
                        htmlFor="type-chains"
                        className={cn(
                          "flex flex-col gap-1.5 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          makingChargesData.goldType === "chains"
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <RadioGroupItem value="chains" id="type-chains" className="sr-only" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Chains</span>
                          <Check className={cn(
                            "h-5 w-5",
                            makingChargesData.goldType === "chains" ? "opacity-100" : "opacity-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs",
                          makingChargesData.goldType === "chains" 
                            ? "text-primary-foreground/80" 
                            : "text-muted-foreground"
                        )}>
                          {makingCharges.chains || 2}% making charges
                        </span>
                      </Label>

                      <Label
                        htmlFor="type-plain"
                        className={cn(
                          "flex flex-col gap-1.5 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          makingChargesData.goldType === "plain"
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <RadioGroupItem value="plain" id="type-plain" className="sr-only" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Plain</span>
                          <Check className={cn(
                            "h-5 w-5",
                            makingChargesData.goldType === "plain" ? "opacity-100" : "opacity-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs",
                          makingChargesData.goldType === "plain" 
                            ? "text-primary-foreground/80" 
                            : "text-muted-foreground"
                        )}>
                          {makingCharges.plain || 3.5}% making charges
                        </span>
                      </Label>

                      <Label
                        htmlFor="type-temple"
                        className={cn(
                          "flex flex-col gap-1.5 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          makingChargesData.goldType === "temple"
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <RadioGroupItem value="temple" id="type-temple" className="sr-only" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Temple</span>
                          <Check className={cn(
                            "h-5 w-5",
                            makingChargesData.goldType === "temple" ? "opacity-100" : "opacity-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs",
                          makingChargesData.goldType === "temple" 
                            ? "text-primary-foreground/80" 
                            : "text-muted-foreground"
                        )}>
                          {makingCharges.temple || 7}% making charges
                        </span>
                      </Label>

                      <Label
                        htmlFor="type-italian"
                        className={cn(
                          "flex flex-col gap-1.5 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          makingChargesData.goldType === "italian"
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        <RadioGroupItem value="italian" id="type-italian" className="sr-only" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Italian Gold</span>
                          <Check className={cn(
                            "h-5 w-5",
                            makingChargesData.goldType === "italian" ? "opacity-100" : "opacity-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs",
                          makingChargesData.goldType === "italian" 
                            ? "text-primary-foreground/80" 
                            : "text-muted-foreground"
                        )}>
                          {makingCharges.italianGold || 18}% making charges
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {/* Display selected percentage */}
                  {makingChargesData.goldType && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-sm font-semibold text-foreground">Selected Making Charges:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-primary">
                            {makingChargesData.percentage}
                          </span>
                          <span className="text-sm font-medium text-primary">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Diamond Making Charges Info */}
                  <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Diamond className="h-5 w-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-2">Diamond Jewelry Making Charges</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          For diamond jewelry, making charges are calculated at a fixed rate of 800 per gram of gold weight.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-2 border-secondary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                          <span className="text-sm font-semibold text-foreground">Fixed Rate:</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-secondary">800</span>
                          <span className="text-xs font-medium text-muted-foreground">/gram</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Images */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">Upload Tag Images</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload at least one clear image of the jewelry tag (top view
                  and bottom view)
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  <ScanLine className="h-4 w-4 animate-pulse" />
                  Scanning Mode Active
                </div>
              </div>{" "}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Top View Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Top View
                  </Label>
                  {imagePreviews.top ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={imagePreviews.top}
                          alt="Top view"
                          className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage("top")}
                        className="w-full gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <Label
                      htmlFor="top-image"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer transition-all group"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground transition-colors" />
                      <span className="text-sm text-muted-foreground mt-2">
                        Click to upload
                      </span>
                      <input
                        id="top-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload("top", e.target.files?.[0] || null)
                        }
                      />
                    </Label>
                  )}
                </div>

                {/* Bottom View Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Bottom View
                  </Label>
                  {imagePreviews.bottom ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={imagePreviews.bottom}
                          alt="Bottom view"
                          className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveImage("bottom")}
                        className="w-full gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <Label
                      htmlFor="bottom-image"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer transition-all group"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground transition-colors" />
                      <span className="text-sm text-muted-foreground mt-2">
                        Click to upload
                      </span>
                      <input
                        id="bottom-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(
                            "bottom",
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </Label>
                  )}
                </div>
              </div>
              {isExtracting && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">
                        Extracting Text...
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Analyzing jewelry tag images
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleExtractText}
                  disabled={!canProceedToStep4 || isExtracting}
                  className="gap-2"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      Scan & Extract
                      <ScanLine className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Verification Questions */}
          {step === 4 && extractedData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  Verification Questions
                </h3>
                <p className="text-sm text-muted-foreground">
                  Answer these questions to get accurate pricing
                </p>
              </div>

              {/* Display Extracted Data */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Extracted Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {/* Total Weight / Gross Weight */}
                  {(extractedData.totalWeight || extractedData.grossWeight) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Gross Weight:</span>
                      <span className="font-medium">{extractedData.totalWeight || extractedData.grossWeight}g</span>
                    </div>
                  )}
                  
                  {/* Weight / Net Weight */}
                  {(extractedData.weight || extractedData.netWeight) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Net Weight:</span>
                      <span className="font-medium">{extractedData.weight || extractedData.netWeight}g</span>
                    </div>
                  )}
                  
                  {/* Purity (shown as Carat) */}
                  {extractedData.carat && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Purity:</span>
                      <span className="font-medium">{extractedData.carat}</span>
                    </div>
                  )}
                  
                  {/* Stone Weight - Prominently displayed */}
                  {extractedData.stoneWeight && (
                    <div className="flex justify-between p-2 rounded">
                      <span className="text-muted-foreground font-semibold">Stone Weight:</span>
                      <span className="font-bold ">{extractedData.stoneWeight}g</span>
                    </div>
                  )}
                  
                  {/* Kundan Weight - Prominently displayed */}
                  {extractedData.kundWeight && (
                    <div className="flex justify-between p-2 rounded">
                      <span className="text-muted-foreground font-semibold">Kundan Weight:</span>
                      <span className="font-bold ">{extractedData.kundWeight}g</span>
                    </div>
                  )}
                  
                  {/* Diamond Weight (for diamond jewelry) */}
                  {extractedData.diamondWeight && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Diamond Weight:</span>
                      <span className="font-medium">{extractedData.diamondWeight} ct</span>
                    </div>
                  )}
                  
                  {/* Diamond Color */}
                  {extractedData.color && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">{extractedData.color}</span>
                    </div>
                  )}
                  
                  {/* Diamond Clarity */}
                  {extractedData.clarity && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Clarity:</span>
                      <span className="font-medium">{extractedData.clarity}</span>
                    </div>
                  )}
                  
                  {/* Certification */}
                  {extractedData.certification && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Certification:</span>
                      <span className="font-medium">{extractedData.certification}</span>
                    </div>
                  )}
                  
                  {/* Item Code */}
                  {extractedData.itemCode && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Item Code:</span>
                      <span className="font-medium">{extractedData.itemCode}</span>
                    </div>
                  )}
                  
                  {/* Display all other fields dynamically */}
                  {Object.entries(extractedData).map(([key, value]) => {
                    // Skip already displayed fields
                    const displayedFields = ['totalWeight', 'grossWeight', 'weight', 'netWeight', 'carat', 
                      'stoneWeight', 'kundWeight', 'diamondWeight', 'color', 'clarity', 'certification', 'itemCode'];
                    
                    if (displayedFields.includes(key) || !value) return null;
                    
                    return (
                      <div key={key} className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium">{value.toString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions based on jewelry type */}
              {jewelryType === "gold" ? (
                <div className="space-y-4">
                  {/* Question 1: Buy Back Guarantee */}
                  <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                          Does your jeweller give 100% buy back on gold weight?
                        </Label>
                        <RadioGroup
                          value={
                            verificationAnswers.buyBackGuarantee?.toString() || ""
                          }
                          onValueChange={(value) =>
                            setVerificationAnswers((prev) => ({
                              ...prev,
                              buyBackGuarantee: value === "true",
                            }))
                          }
                          className="grid grid-cols-2 gap-3"
                        >
                          <Label
                            htmlFor="buyback-yes"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.buyBackGuarantee === true
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                            )}
                          >
                            <RadioGroupItem value="true" id="buyback-yes" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.buyBackGuarantee === true ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">Yes</span>
                          </Label>
                          <Label
                            htmlFor="buyback-no"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.buyBackGuarantee === false
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                            )}
                          >
                            <RadioGroupItem value="false" id="buyback-no" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.buyBackGuarantee === false ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">No</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Raw Form */}
                  <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                          Does your jeweller show you the raw form of jewelry
                          (without stone/kundan)?
                        </Label>
                        <RadioGroup
                          value={verificationAnswers.showsRawForm?.toString() || ""}
                          onValueChange={(value) =>
                            setVerificationAnswers((prev) => ({
                              ...prev,
                              showsRawForm: value === "true",
                            }))
                          }
                          className="grid grid-cols-2 gap-3"
                        >
                          <Label
                            htmlFor="rawform-yes"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.showsRawForm === true
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                            )}
                          >
                            <RadioGroupItem value="true" id="rawform-yes" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.showsRawForm === true ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">Yes</span>
                          </Label>
                          <Label
                            htmlFor="rawform-no"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.showsRawForm === false
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-primary/50 hover:bg-primary/5"
                            )}
                          >
                            <RadioGroupItem value="false" id="rawform-no" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.showsRawForm === false ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">No</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Question 1: Diamond Appreciation */}
                  <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                        <span className="text-sm font-bold text-secondary">1</span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                          Does your jeweller give appreciation on diamond?
                        </Label>
                        <RadioGroup
                          value={
                            verificationAnswers.diamondAppreciation?.toString() ||
                            ""
                          }
                          onValueChange={(value) =>
                            setVerificationAnswers((prev) => ({
                              ...prev,
                              diamondAppreciation: value === "true",
                            }))
                          }
                          className="grid grid-cols-2 gap-3"
                        >
                          <Label
                            htmlFor="appreciation-yes"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.diamondAppreciation === true
                                ? "border-secondary bg-secondary text-secondary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-secondary/50 hover:bg-secondary/5"
                            )}
                          >
                            <RadioGroupItem value="true" id="appreciation-yes" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.diamondAppreciation === true ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">Yes</span>
                          </Label>
                          <Label
                            htmlFor="appreciation-no"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.diamondAppreciation === false
                                ? "border-secondary bg-secondary text-secondary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-secondary/50 hover:bg-secondary/5"
                            )}
                          >
                            <RadioGroupItem value="false" id="appreciation-no" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.diamondAppreciation === false ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">No</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Certificate Type */}
                  <div className="space-y-4 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                        <span className="text-sm font-bold text-secondary">2</span>
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                          Select type of certificate on diamond
                        </Label>
                        <RadioGroup
                          value={verificationAnswers.certificationType || ""}
                          onValueChange={(value) =>
                            setVerificationAnswers((prev) => ({
                              ...prev,
                              certificationType: value as Certification,
                            }))
                          }
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          <Label
                            htmlFor="cert-igi"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.certificationType === "IGI"
                                ? "border-secondary bg-secondary text-secondary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-secondary/50 hover:bg-secondary/5"
                            )}
                          >
                            <RadioGroupItem value="IGI" id="cert-igi" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.certificationType === "IGI" ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">IGI Certified</span>
                          </Label>
                          <Label
                            htmlFor="cert-non-igi"
                            className={cn(
                              "flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                              verificationAnswers.certificationType === "Non-IGI"
                                ? "border-secondary bg-secondary text-secondary-foreground shadow-md"
                                : "border-muted-foreground/20 bg-background hover:border-secondary/50 hover:bg-secondary/5"
                            )}
                          >
                            <RadioGroupItem value="Non-IGI" id="cert-non-igi" className="sr-only" />
                            <Check className={cn(
                              "h-4 w-4",
                              verificationAnswers.certificationType === "Non-IGI" ? "opacity-100" : "opacity-0"
                            )} />
                            <span className="font-medium">Non-IGI (Self Certified)</span>
                          </Label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canProceedToStep4}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}