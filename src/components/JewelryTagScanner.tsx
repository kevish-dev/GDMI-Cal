import { useState, useEffect, useRef } from "react";
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
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromImages, normalizeExtractedData } from "@/utils/getText";
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
  const [showUploadOption, setShowUploadOption] = useState<{
    top: boolean;
    bottom: boolean;
  }>({
    top: false,
    bottom: false,
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
  const [activeCamera, setActiveCamera] = useState<"top" | "bottom" | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges } = useRates();
  
  // Refs for camera inputs and video
  const topCameraInputRef = useRef<HTMLInputElement>(null);
  const bottomCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-set making charges for diamond jewelry when diamond type is selected
  useEffect(() => {
    if (jewelryType === "diamond" && !makingChargesData.percentage) {
      setMakingChargesData({ percentage: 800 });
    }
  }, [jewelryType, makingChargesData.percentage]);

  // Cleanup camera stream on unmount or when camera closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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

  const startCamera = async (view: "top" | "bottom") => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera not supported",
          description: "Your browser doesn't support camera access. Please use the upload option.",
          variant: "destructive",
        });
        toggleUploadOption(view);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setActiveCamera(view);

      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access or use the upload option.",
        variant: "destructive",
      });
      // Fallback to upload option
      toggleUploadOption(view);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !activeCamera) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File from the blob
        const file = new File([blob], `${activeCamera}-view-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        handleImageUpload(activeCamera, file);
        closeCamera();
      }
    }, "image/jpeg", 0.9);
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveCamera(null);
  };

  const handleCameraCapture = (view: "top" | "bottom") => {
    startCamera(view);
  };

  const toggleUploadOption = (view: "top" | "bottom") => {
    setShowUploadOption((prev) => ({
      ...prev,
      [view]: !prev[view],
    }));
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
      
      // Normalize the extracted data to handle various tag formats
      const normalizedData = normalizeExtractedData(data, jewelryType!);
      
      setExtractedData(normalizedData);
      setStep(3); // Go to verification step
      toast({
        title: "Text extracted successfully",
        description:
          "Please verify the extracted information",
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
    if (!jewelryType || !extractedData) {
      toast({
        title: "Missing data",
        description: "Please ensure all required information is available.",
        variant: "destructive",
      });
      return;
    }

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
        
        if (weight <= 0) {
          toast({
            title: "Invalid weight",
            description: "Gold weight must be greater than 0.",
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }
        
        goldWeightValue = weight;
        const caratKey = extractedData.carat?.toUpperCase();

        if (!caratKey) {
          toast({
            title: "Missing purity",
            description: "Gold purity (carat) information is required.",
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }

        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        
        if (goldRate <= 0) {
          toast({
            title: "Rate not found",
            description: `Gold rate for ${caratKey} not found. Please check the rates.`,
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }
        
        goldValue = weight * goldRate;
        
        // Calculate making charges as percentage of gold value
        const makingChargePercentage = makingChargesData.percentage || 0;
        calculatedMakingCharges = (goldValue * makingChargePercentage) / 100;
        makingChargeRateDisplay = makingChargePercentage;
      } else if (jewelryType === "diamond") {
        const goldWeight = extractedData.weight || extractedData.netWeight || 0;
        
        // Calculate diamond weight from multiple sources
        let diamondWeight = extractedData.diamondWeight || 0;
        
        // If diamondWeight is not directly available, calculate from diamonds array
        if (diamondWeight <= 0 && extractedData.diamonds && Array.isArray(extractedData.diamonds)) {
          diamondWeight = extractedData.diamonds.reduce((sum, diamond) => {
            return sum + (diamond.weight || 0);
          }, 0);
        }
        
        if (goldWeight <= 0) {
          toast({
            title: "Invalid gold weight",
            description: "Gold weight must be greater than 0.",
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }
        
        if (diamondWeight <= 0) {
          toast({
            title: "Invalid diamond weight",
            description: "Diamond weight must be greater than 0. Please check the extracted data.",
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }
        
        goldWeightValue = goldWeight;
        diamondWeightValue = diamondWeight;
        const caratKey = extractedData.carat?.toUpperCase();

        if (!caratKey) {
          toast({
            title: "Missing purity",
            description: "Gold purity (carat) information is required.",
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }

        goldRate =
          goldRates.find((rate) => rate.carat === caratKey)?.rate || 0;
        
        if (goldRate <= 0) {
          toast({
            title: "Rate not found",
            description: `Gold rate for ${caratKey} not found. Please check the rates.`,
            variant: "destructive",
          });
          setIsCalculating(false);
          return;
        }
        
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

  const canProceedToStep2 = 
    jewelryType !== null &&
    (jewelryType === "gold"
      ? makingChargesData.goldType !== undefined && makingChargesData.percentage !== undefined
      : true); // Diamond jewelry auto-sets making charges, no manual input needed
  const canProceedToStep3 = images.top !== null; // Only top image required
  const canCalculate =
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
          
          {/* Custom Stepped Progress Bar */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {[1, 2, 3].map((stepNumber) => (
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
          {/* Step 1: Select Type & Making Charges */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Select Type & Making Charges</h3>
                <p className="text-sm text-muted-foreground">
                  Choose jewelry type and set making charges
                </p>
              </div>

              {/* Jewelry Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Jewelry Type</Label>
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
                        "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary cursor-pointer transition-all",
                        jewelryType === "gold" && "border-primary bg-primary/5"
                      )}
                    >
                      <Crown className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-semibold">Gold</span>
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
                        "flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-secondary cursor-pointer transition-all",
                        jewelryType === "diamond" &&
                          "border-secondary bg-secondary/5"
                      )}
                    >
                      <Diamond className="h-8 w-8 mb-2 text-secondary" />
                      <span className="text-sm font-semibold">Diamond</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Making Charges Section */}
              {jewelryType && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Making Charges</Label>
                  </div>

                  {jewelryType === "gold" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Select jewelry type for making charge percentage
                      </p>
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
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Fixed making charge rate (automatically applied)
                      </p>
                      <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border-2 border-secondary/20">
                        <div>
                          <p className="font-semibold text-secondary">Diamond Making Charge</p>
                          <p className="text-xs text-muted-foreground mt-1">Per gram of gold weight</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-secondary">₹{makingChargesData.percentage || 800}</p>
                          <p className="text-xs text-muted-foreground">/gram</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          This rate is automatically calculated per gram of gold weight in diamond jewelry
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

          {/* Step 2: Upload Images & Extract */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Camera Modal - Full Screen */}
              {activeCamera && (
                <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                  {/* Camera Header */}
                  <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-base sm:text-lg">
                            Capture {activeCamera === "top" ? "Top" : "Bottom"} View
                          </h3>
                          <p className="text-white/70 text-xs sm:text-sm">
                            Position the tag within the frame
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeCamera}
                        className="text-white hover:bg-white/20 rounded-full"
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Camera Preview */}
                  <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Framing Guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-[80%] max-w-md aspect-[3/4] sm:aspect-[4/3]">
                        {/* Corner Borders */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                        
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                            <p className="text-white text-xs sm:text-sm font-medium">
                              Align tag here
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 sm:p-8">
                    <div className="flex items-center justify-center gap-6 sm:gap-8">
                      {/* Cancel Button */}
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={closeCamera}
                        className="text-white hover:bg-white/20 rounded-full px-6"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                      
                      {/* Capture Button */}
                      <button
                        onClick={capturePhoto}
                        className="relative group"
                      >
                        {/* Outer Ring */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          {/* Inner Circle */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white group-hover:bg-white/90 transition-colors shadow-xl">
                          </div>
                        </div>
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-20"></div>
                      </button>
                      
                      {/* Spacer for symmetry */}
                      <div className="w-[100px] sm:w-[116px]"></div>
                    </div>
                    
                    {/* Instruction Text */}
                    <div className="mt-4 text-center">
                      <p className="text-white/80 text-xs sm:text-sm">
                        Tap the button to capture photo
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">Capture Tag Images</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Take clear photos of the jewelry tag for scanning
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-xs font-medium text-primary">
                  <ScanLine className="h-4 w-4 animate-pulse" />
                  Scanning Mode Active
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Top View Capture */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Top View <span className="text-destructive">*</span>
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
                    <div className="space-y-3">
                      {/* Primary: Camera Capture Button */}
                      <Button
                        type="button"
                        onClick={() => handleCameraCapture("top")}
                        className="w-full h-48 flex flex-col items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary shadow-lg"
                      >
                        <Camera className="h-12 w-12" />
                        <div className="text-center">
                          <p className="font-semibold text-base">Open Camera</p>
                          <p className="text-xs opacity-90 mt-1">Take a photo of the tag</p>
                        </div>
                      </Button>
                      
                      {/* Secondary: Upload Option (Toggle) */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleUploadOption("top")}
                          className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
                        >
                          {showUploadOption.top ? "Hide upload option" : "Or upload from gallery"}
                        </button>
                        
                        {showUploadOption.top && (
                          <div className="mt-3 animate-in fade-in duration-300">
                            <Label
                              htmlFor="top-image-upload"
                              className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                            >
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-2">
                                Click to upload from gallery
                              </span>
                              <input
                                id="top-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageUpload("top", e.target.files?.[0] || null)
                                }
                              />
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom View Capture */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Bottom View <span className="text-xs text-muted-foreground">(Optional)</span>
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
                    <div className="space-y-3">
                      {/* Primary: Camera Capture Button */}
                      <Button
                        type="button"
                        onClick={() => handleCameraCapture("bottom")}
                        className="w-full h-48 flex flex-col items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-2 border-secondary shadow-lg"
                      >
                        <Camera className="h-12 w-12" />
                        <div className="text-center">
                          <p className="font-semibold text-base">Open Camera</p>
                          <p className="text-xs opacity-90 mt-1">Take a photo of the tag</p>
                        </div>
                      </Button>
                      
                      {/* Secondary: Upload Option (Toggle) */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleUploadOption("bottom")}
                          className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
                        >
                          {showUploadOption.bottom ? "Hide upload option" : "Or upload from gallery"}
                        </button>
                        
                        {showUploadOption.bottom && (
                          <div className="mt-3 animate-in fade-in duration-300">
                            <Label
                              htmlFor="bottom-image-upload"
                              className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                            >
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground mt-2">
                                Click to upload from gallery
                              </span>
                              <input
                                id="bottom-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageUpload("bottom", e.target.files?.[0] || null)
                                }
                              />
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
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
                  {(extractedData.diamondWeight || (extractedData.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0)) && (
                    <div className="flex justify-between p-2 bg-secondary/10 rounded border border-secondary/20">
                      <span className="text-muted-foreground font-semibold">Diamond Weight:</span>
                      <span className="font-bold text-secondary">
                        {extractedData.diamondWeight || 
                          extractedData.diamonds?.reduce((sum, d) => sum + (d.weight || 0), 0) || 0} ct
                      </span>
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
                  
                  {/* Diameter */}
                  {extractedData.diameter && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Diameter:</span>
                      <span className="font-medium">{extractedData.diameter}</span>
                    </div>
                  )}
                  
                  {/* Jewelry Type */}
                  {extractedData.type && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{extractedData.type}</span>
                    </div>
                  )}
                </div>
                
                {/* Detailed Stones Information */}
                {extractedData.stones && Array.isArray(extractedData.stones) && extractedData.stones.length > 0 && (
                  <div className="mt-3 p-3 bg-background rounded-lg border">
                    <h5 className="font-semibold text-xs text-muted-foreground mb-2">Stone Details:</h5>
                    <div className="space-y-2">
                      {extractedData.stones.map((stone: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                          <span className="font-medium">{stone.type || 'Stone'}</span>
                          <span>
                            {stone.weight}g
                            {stone.count && ` (${stone.count} pcs)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Detailed Diamond Information */}
                {extractedData.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0 && (
                  <div className="mt-3 p-3 bg-background rounded-lg border">
                    <h5 className="font-semibold text-xs text-muted-foreground mb-2">Diamond Details:</h5>
                    <div className="space-y-2">
                      {extractedData.diamonds.map((diamond: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                          <span className="font-medium">
                            {diamond.type || 'Diamond'}
                            {diamond.color && ` (${diamond.color}`}
                            {diamond.clarity && `/${diamond.clarity}`}
                            {(diamond.color || diamond.clarity) && ')'}
                          </span>
                          <span>
                            {diamond.weight} ct
                            {diamond.count && ` (${diamond.count} pcs)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Other Stones Information */}
                {extractedData.otherStones && Array.isArray(extractedData.otherStones) && extractedData.otherStones.length > 0 && (
                  <div className="mt-3 p-3 bg-background rounded-lg border">
                    <h5 className="font-semibold text-xs text-muted-foreground mb-2">Other Stones:</h5>
                    <div className="space-y-2">
                      {extractedData.otherStones.map((stone: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                          <span className="font-medium capitalize">{stone.type || 'Stone'}</span>
                          <span>
                            {stone.weight}g
                            {stone.count && ` (${stone.count} pcs)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Raw Text if available */}
                {extractedData.rawText && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg border text-xs">
                    <h5 className="font-semibold text-muted-foreground mb-1">Additional Info:</h5>
                    <p className="text-muted-foreground">{extractedData.rawText}</p>
                  </div>
                )}
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
                  onClick={handleCalculatePreview}
                  disabled={!canCalculate || isCalculating}
                  className="gap-2"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4" />
                      Calculate & Finish
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