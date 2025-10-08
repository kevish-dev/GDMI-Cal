import { useState } from "react";
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

interface ScanResult {
  jewelryType: JewelryType;
  extractedData: ExtractedData;
  verificationAnswers: VerificationAnswers;
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
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges } = useRates();

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
      // Calculate price based on extracted data (without making charges)
      let goldValue = 0;
      let diamondValue = 0;
      const calculatedMakingCharges = 0; // No making charges as per requirement

      if (jewelryType === "gold") {
        const weight = extractedData.weight || extractedData.netWeight || 0;
        const caratKey = extractedData.carat?.toUpperCase();

        const goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        goldValue = weight * goldRate;
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
  const canComplete =
    jewelryType === "gold"
      ? verificationAnswers.buyBackGuarantee !== undefined &&
        verificationAnswers.showsRawForm !== undefined
      : verificationAnswers.diamondAppreciation !== undefined &&
        verificationAnswers.certificationType !== undefined;

  const progressPercentage = (step / 3) * 100;

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
                <CardDescription>Step {step} of 3</CardDescription>
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
          <Progress value={progressPercentage} className="mt-4" />
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
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all",
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
                      "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-secondary cursor-pointer transition-all",
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
                    <div className="relative group">
                      <img
                        src={imagePreviews.top}
                        alt="Top view"
                        className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage("top")}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <Label
                      htmlFor="top-image"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
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
                    <div className="relative group">
                      <img
                        src={imagePreviews.bottom}
                        alt="Bottom view"
                        className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage("bottom")}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <Label
                      htmlFor="bottom-image"
                      className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
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
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Extracted Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions based on jewelry type */}
              {jewelryType === "gold" ? (
                <div className="space-y-4">
                  {/* Question 1: Buy Back Guarantee */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-semibold">
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
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="buyback-yes" />
                        <Label htmlFor="buyback-yes" className="cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="buyback-no" />
                        <Label htmlFor="buyback-no" className="cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Question 2: Raw Form */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-semibold">
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
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="rawform-yes" />
                        <Label htmlFor="rawform-yes" className="cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="rawform-no" />
                        <Label htmlFor="rawform-no" className="cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Question 1: Diamond Appreciation */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-semibold">
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
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="appreciation-yes" />
                        <Label
                          htmlFor="appreciation-yes"
                          className="cursor-pointer"
                        >
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="appreciation-no" />
                        <Label
                          htmlFor="appreciation-no"
                          className="cursor-pointer"
                        >
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Question 2: Certificate Type */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label className="text-sm font-semibold">
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
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="IGI" id="cert-igi" />
                        <Label htmlFor="cert-igi" className="cursor-pointer">
                          IGI Certified
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non-IGI" id="cert-non-igi" />
                        <Label
                          htmlFor="cert-non-igi"
                          className="cursor-pointer"
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
