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

interface ScanResult {
  jewelryType: JewelryType;
  extractedData: ExtractedData;
  verificationAnswers: VerificationAnswers;
  makingCharges: MakingCharges;
  calculatedPrice: number;
  priceBreakdown: {
    goldValue: number;
    diamondValue: number;
    makingCharges: number;
    finalPrice: number;
  };
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
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges } = useRates();

  // Auto-set making charges for diamond jewelry when reaching step 4
  useEffect(() => {
    if (step === 4 && jewelryType === "diamond" && !makingChargesData.percentage) {
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
      setStep(3);
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

  const handleComplete = async () => {
    if (!jewelryType || !extractedData) return;

    setIsCalculating(true);

    try {
      // Calculate price based on extracted data with making charges
      let goldValue = 0;
      let diamondValue = 0;
      let calculatedMakingCharges = 0;

      if (jewelryType === "gold") {
        const weight = extractedData.weight || extractedData.netWeight || 0;
        const caratKey = extractedData.carat?.toUpperCase();

        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        goldValue = weight * goldRate;
        
        // Calculate making charges as percentage of gold value
        const makingChargePercentage = makingChargesData.percentage || 0;
        calculatedMakingCharges = (goldValue * makingChargePercentage) / 100;
      } else if (jewelryType === "diamond") {
        const goldWeight = extractedData.weight || extractedData.netWeight || 0;
        const diamondWeight = extractedData.diamondWeight || 0;
        const caratKey = extractedData.carat?.toUpperCase();

        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        goldValue = goldWeight * goldRate;

        // Get diamond rate based on certification from verification answers
        const certification =
          verificationAnswers.certificationType === "IGI" ? "IGI" : "Self";
        const matchingRate = diamondRates.find(
          (rate) => rate.certification === certification
        );
        const diamondRate = matchingRate?.rate || 50000;

        diamondValue = diamondWeight * diamondRate;
        
        // Calculate making charges as fixed rate per gram
        calculatedMakingCharges = (makingChargesData.percentage || 800) * goldWeight;
      }

      const finalPrice = goldValue + diamondValue + calculatedMakingCharges;

      const breakdown = {
        goldValue,
        diamondValue,
        makingCharges: calculatedMakingCharges,
        finalPrice,
      };

      setCalculatedPrice(finalPrice);
      setPriceBreakdown(breakdown);

      const result: ScanResult = {
        jewelryType,
        extractedData,
        verificationAnswers,
        makingCharges: makingChargesData,
        calculatedPrice: finalPrice,
        priceBreakdown: breakdown,
      };

      toast({
        title: "Price calculated!",
        description: `Total price: ₹${finalPrice.toLocaleString("en-IN")}`,
      });

      onScanComplete(result);
      onClose();
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
  const canProceedToStep3 = images.top !== null; // Only top image required
  const canProceedToStep4 =
    jewelryType === "gold"
      ? verificationAnswers.buyBackGuarantee !== undefined &&
        verificationAnswers.showsRawForm !== undefined
      : verificationAnswers.diamondAppreciation !== undefined &&
        verificationAnswers.certificationType !== undefined;
  const canComplete =
    jewelryType === "gold"
      ? makingChargesData.goldType !== undefined && makingChargesData.percentage !== undefined
      : makingChargesData.percentage !== undefined;

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

          {/* Step 2: Upload Images */}
          {step === 2 && (
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
                  onClick={() => setStep(1)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleExtractText}
                  disabled={!canProceedToStep3 || isExtracting}
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

          {/* Step 3: Verification Questions */}
          {step === 3 && extractedData && (
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
                  {/* Total Weight */}
                  {(extractedData.totalWeight || extractedData.grossWeight) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Total Weight:</span>
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
                  
                  {/* KUND Weight */}
                  {(extractedData.kundWeight || extractedData.stoneWeight) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">KUND Weight:</span>
                      <span className="font-medium">{extractedData.kundWeight || extractedData.stoneWeight}g</span>
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
                </div>
              </div>

              {/* Questions based on jewelry type */}
              {jewelryType === "gold" ? (
                <div className="space-y-4">
                  {/* Question 1: Buy Back Guarantee */}
                  <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
                    <Label className="text-sm sm:text-base font-semibold leading-relaxed">
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
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="true" id="buyback-yes" />
                        <Label htmlFor="buyback-yes" className="cursor-pointer font-normal flex-1">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="false" id="buyback-no" />
                        <Label htmlFor="buyback-no" className="cursor-pointer font-normal flex-1">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Question 2: Raw Form */}
                  <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
                    <Label className="text-sm sm:text-base font-semibold leading-relaxed">
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
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="true" id="rawform-yes" />
                        <Label htmlFor="rawform-yes" className="cursor-pointer font-normal flex-1">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="false" id="rawform-no" />
                        <Label htmlFor="rawform-no" className="cursor-pointer font-normal flex-1">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Question 1: Diamond Appreciation */}
                  <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
                    <Label className="text-sm sm:text-base font-semibold leading-relaxed">
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
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="true" id="appreciation-yes" />
                        <Label
                          htmlFor="appreciation-yes"
                          className="cursor-pointer font-normal flex-1"
                        >
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="false" id="appreciation-no" />
                        <Label
                          htmlFor="appreciation-no"
                          className="cursor-pointer font-normal flex-1"
                        >
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Question 2: Certificate Type */}
                  <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
                    <Label className="text-sm sm:text-base font-semibold leading-relaxed">
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
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="IGI" id="cert-igi" />
                        <Label htmlFor="cert-igi" className="cursor-pointer font-normal flex-1">
                          IGI Certified
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md sm:border-0 sm:p-0">
                        <RadioGroupItem value="Non-IGI" id="cert-non-igi" />
                        <Label
                          htmlFor="cert-non-igi"
                          className="cursor-pointer font-normal flex-1"
                        >
                          Non-IGI (Self Certified)
                        </Label>
                      </div>
                    </RadioGroup>
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

          {/* Step 4: Making Charges */}
          {step === 4 && extractedData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Making Charges</h3>
                <p className="text-sm text-muted-foreground">
                  Select jewelry type and enter making charge percentage
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
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <RadioGroupItem value="chains" id="type-chains" />
                        <Label htmlFor="type-chains" className="cursor-pointer flex-1">
                          <div className="font-medium">Chains</div>
                          <div className="text-xs text-muted-foreground">
                            {makingCharges.chains || 2}% making charges
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <RadioGroupItem value="plain" id="type-plain" />
                        <Label htmlFor="type-plain" className="cursor-pointer flex-1">
                          <div className="font-medium">Plain</div>
                          <div className="text-xs text-muted-foreground">
                            {makingCharges.plain || 3.5}% making charges
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <RadioGroupItem value="temple" id="type-temple" />
                        <Label htmlFor="type-temple" className="cursor-pointer flex-1">
                          <div className="font-medium">Temple</div>
                          <div className="text-xs text-muted-foreground">
                            {makingCharges.temple || 7}% making charges
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <RadioGroupItem value="italian" id="type-italian" />
                        <Label htmlFor="type-italian" className="cursor-pointer flex-1">
                          <div className="font-medium">Italian Gold</div>
                          <div className="text-xs text-muted-foreground">
                            {makingCharges.italianGold || 18}% making charges
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Display selected percentage */}
                  {makingChargesData.goldType && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Making Charges:</span>
                        <span className="text-lg font-bold text-primary">
                          {makingChargesData.percentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Diamond Making Charges Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Diamond Jewelry Making Charges</h4>
                    <p className="text-sm text-muted-foreground">
                      For diamond jewelry, making charges are calculated at ₹800 per gram of gold weight.
                    </p>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rate:</span>
                        <span className="text-lg font-bold text-primary">
                          ₹800/gram
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="gap-2"
                  disabled={isCalculating}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!canComplete || isCalculating}
                  className="gap-2"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating Price...
                    </>
                  ) : (
                    <>
                      Calculate & Complete
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
