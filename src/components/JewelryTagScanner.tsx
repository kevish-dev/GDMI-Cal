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
  RotateCcw,
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
  diamondColor?: string;
  diamondClarity?: string;
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
  
  // State for missing compulsory details
  const [missingDetails, setMissingDetails] = useState<{
    carat?: string;
    netWeight?: number;
    color?: string;
    clarity?: string;
  }>({});
  
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
      // Merge missing details with extracted data
      const completeData: ExtractedData = {
        ...extractedData,
        carat: extractedData.carat || missingDetails.carat,
        weight: extractedData.weight || missingDetails.netWeight,
        netWeight: extractedData.netWeight || missingDetails.netWeight,
        color: extractedData.color || missingDetails.color,
        clarity: extractedData.clarity || missingDetails.clarity,
      };

      // Calculate Net Weight from Gross Weight - Diamond Weight if net weight is missing
      if (!completeData.netWeight && !completeData.weight) {
        const grossWeight = completeData.totalWeight || completeData.grossWeight || 0;
        const diamondWeight = completeData.diamondWeight || 0;
        
        if (grossWeight > 0 && diamondWeight > 0) {
          const calculatedNetWeight = grossWeight - diamondWeight;
          completeData.netWeight = calculatedNetWeight;
          completeData.weight = calculatedNetWeight;
        }
      }

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
        const weight = completeData.weight || completeData.netWeight || 0;
        
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
        const caratKey = completeData.carat?.toUpperCase();

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
        const goldWeight = completeData.weight || completeData.netWeight || 0;
        
        // Calculate diamond weight from multiple sources
        let diamondWeight = completeData.diamondWeight || 0;
        
        // If diamondWeight is not directly available, calculate from diamonds array
        if (diamondWeight <= 0 && completeData.diamonds && Array.isArray(completeData.diamonds)) {
          diamondWeight = completeData.diamonds.reduce((sum, diamond) => {
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
        const caratKey = completeData.carat?.toUpperCase();

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

        // Get diamond rate based on certification type - use fixed rates
        const certification = verificationAnswers.certificationType;
        if (certification === "IGI") {
          diamondRate = 35000; // Fixed rate for IGI certified
        } else {
          diamondRate = 25000; // Fixed rate for Non-IGI (Self Certified)
        }

        diamondValue = diamondWeight * diamondRate;
        
        // Calculate making charges as fixed rate per gram
        calculatedMakingCharges = (makingChargesData.percentage || 800) * goldWeight;
        makingChargeRateDisplay = makingChargesData.percentage || 800;
      }

      const subTotal = goldValue + diamondValue + calculatedMakingCharges;
      const finalPrice = subTotal; // No GST - final price is same as subtotal

      // Determine display values for diamond color and clarity
      const displayColor = completeData.color || (jewelryType === "diamond" ? "H-I" : undefined);
      const displayClarity = completeData.clarity || (jewelryType === "diamond" ? "SI" : undefined);

      const breakdown: PriceBreakdown = {
        goldRate,
        goldWeight: goldWeightValue,
        goldValue,
        diamondRate: diamondRate > 0 ? diamondRate : undefined,
        diamondWeight: diamondWeightValue > 0 ? diamondWeightValue : undefined,
        diamondValue,
        diamondColor: displayColor,
        diamondClarity: displayClarity,
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
  
  // Check if all compulsory details are available
  // Net weight can be calculated from Gross Weight - Diamond Weight
  const hasNetWeight = !!(
    extractedData?.weight || 
    extractedData?.netWeight ||
    (
      (extractedData?.totalWeight || extractedData?.grossWeight) &&
      (extractedData?.diamondWeight || 
       (extractedData?.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0))
    )
  );
  
  const hasMissingDetails = !extractedData?.carat || !hasNetWeight;
  const missingDetailsFilled = 
    (!extractedData?.carat ? !!missingDetails.carat : true) &&
    (!hasNetWeight ? !!missingDetails.netWeight : true);
  
  const canCalculate =
    (!hasMissingDetails || missingDetailsFilled) &&
    (jewelryType === "gold"
      ? verificationAnswers.buyBackGuarantee !== undefined &&
        verificationAnswers.showsRawForm !== undefined
      : verificationAnswers.diamondAppreciation !== undefined &&
        verificationAnswers.certificationType !== undefined);

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
                <h3 className="text-xl font-semibold text-foreground">
                  Select type of jewellery
                </h3>
              </div>

              {/* Jewelry Type Selection with Making Charges */}
              <div className="space-y-4">
                {/* Option A: Gold with Making Charges */}
                <div 
                  className={cn(
                    "group transition-all duration-300",
                    jewelryType === "gold" && "scale-[1.01]"
                  )}
                >
                  <div className={cn(
                    "relative rounded-2xl border-2 transition-all duration-300",
                    jewelryType === "gold" 
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
                      : "border-muted-foreground/20 bg-background"
                  )}>
                    {/* Letter Badge */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white shadow-lg z-10">
                      A
                    </div>
                    
                    {/* Selection Indicator */}
                    {jewelryType === "gold" && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300 z-10">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}

                    {/* Main Gold Header - Clickable */}
                    <div 
                      onClick={() => setJewelryType("gold")}
                      className="p-4 sm:p-6 cursor-pointer hover:bg-primary/5 transition-colors rounded-t-2xl"
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        {/* Icon */}
                        <div className={cn(
                          "p-3 sm:p-4 rounded-xl transition-colors flex-shrink-0",
                          jewelryType === "gold" ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Crown className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 transition-colors",
                            jewelryType === "gold" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl sm:text-2xl font-bold">Gold</h4>
                        </div>
                      </div>
                    </div>

                    {/* Gold Making Charges Sub-options with Radio Inputs */}
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-muted">
                      <p className="text-xs text-muted-foreground mb-3">Select making charge type:</p>
                      <RadioGroup
                        value={jewelryType === "gold" ? (makingChargesData.goldType || "") : ""}
                        onValueChange={(value) => {
                          setJewelryType("gold");
                          const type = value as GoldType;
                          const rates = {
                            chains: makingCharges.chains || 2,
                            plain: makingCharges.plain || 3.5,
                            temple: makingCharges.temple || 7,
                            italian: makingCharges.italianGold || 18
                          };
                          setMakingChargesData((prev) => ({
                            ...prev,
                            goldType: type,
                            percentage: rates[type],
                          }));
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                      >
                        {[
                          { value: 'chains', label: 'Chains', rate: makingCharges.chains || 2 },
                          { value: 'plain', label: 'Plain', rate: makingCharges.plain || 3.5 },
                          { value: 'temple', label: 'Temple', rate: makingCharges.temple || 7 },
                          { value: 'italian', label: 'Italian Gold', rate: makingCharges.italianGold || 18 }
                        ].map((type) => (
                          <div key={type.value}>
                            <RadioGroupItem
                              value={type.value}
                              id={`gold-${type.value}`}
                              className="sr-only peer"
                            />
                            <Label
                              htmlFor={`gold-${type.value}`}
                              className={cn(
                                "flex flex-col gap-1 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                                <div className={cn(
                                  "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                  jewelryType === "gold" && makingChargesData.goldType === type.value
                                    ? "border-primary-foreground bg-primary-foreground"
                                    : "border-muted-foreground"
                                )}>
                                  {jewelryType === "gold" && makingChargesData.goldType === type.value && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs peer-data-[state=checked]:text-primary-foreground/80 text-muted-foreground">
                                {type.rate}% charges
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                {/* Option B: Diamond with Making Charges */}
                <div 
                  className={cn(
                    "group transition-all duration-300",
                    jewelryType === "diamond" && "scale-[1.01]"
                  )}
                >
                  <div className={cn(
                    "relative rounded-2xl border-2 transition-all duration-300",
                    jewelryType === "diamond" 
                      ? "border-secondary bg-secondary/5 shadow-lg shadow-secondary/20" 
                      : "border-muted-foreground/20 bg-background"
                  )}>
                    {/* Letter Badge */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-white shadow-lg z-10">
                      B
                    </div>
                    
                    {/* Selection Indicator */}
                    {jewelryType === "diamond" && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300 z-10">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}

                    {/* Main Diamond Header - Clickable */}
                    <div 
                      onClick={() => {
                        setJewelryType("diamond");
                        setMakingChargesData((prev) => ({
                          ...prev,
                          goldType: null,
                          percentage: 800,
                        }));
                      }}
                      className="p-4 sm:p-6 cursor-pointer hover:bg-secondary/5 transition-colors rounded-t-2xl"
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        {/* Icon */}
                        <div className={cn(
                          "p-3 sm:p-4 rounded-xl transition-colors flex-shrink-0",
                          jewelryType === "diamond" ? "bg-secondary/10" : "bg-muted"
                        )}>
                          <Diamond className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 transition-colors",
                            jewelryType === "diamond" ? "text-secondary" : "text-muted-foreground"
                          )} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl sm:text-2xl font-bold">Diamond</h4>
                        </div>
                      </div>
                    </div>

                    {/* Diamond Making Charges Info */}
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t border-muted">
                      <p className="text-xs text-muted-foreground mb-3">Fixed making charge (per gram):</p>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary/10 rounded-lg border-2 border-secondary/20">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-secondary">Making Charge</p>
                          <p className="text-xs text-muted-foreground mt-1">Auto-applied</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-lg sm:text-xl font-bold text-secondary">₹800</p>
                          <p className="text-xs text-muted-foreground">/gram</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                    <div className="relative group">
                      <img
                        src={imagePreviews.top}
                        alt="Top view"
                        className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                      />
                      {/* Retake Button - Top Left */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemoveImage("top")}
                        className="absolute top-2 left-2 gap-1.5 shadow-lg hover:shadow-xl transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retake
                      </Button>
                      {/* Success Indicator - Top Right */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
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
                    <div className="relative group">
                      <img
                        src={imagePreviews.bottom}
                        alt="Bottom view"
                        className="w-full h-48 object-cover rounded-lg border-2 border-primary"
                      />
                      {/* Retake Button - Top Left */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemoveImage("bottom")}
                        className="absolute top-2 left-2 gap-1.5 shadow-lg hover:shadow-xl transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retake
                      </Button>
                      {/* Success Indicator - Top Right */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
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
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue
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
                  
                  {/* Weight / Net Weight - Show calculated if available */}
                  {(() => {
                    const netWeight = extractedData.weight || extractedData.netWeight;
                    const grossWeight = extractedData.totalWeight || extractedData.grossWeight;
                    const diamondWeight = extractedData.diamondWeight || 
                      (extractedData.diamonds && Array.isArray(extractedData.diamonds) 
                        ? extractedData.diamonds.reduce((sum, d) => sum + (d.weight || 0), 0) 
                        : 0);
                    
                    const calculatedNetWeight = !netWeight && grossWeight && diamondWeight 
                      ? grossWeight - diamondWeight 
                      : null;
                    
                    const displayWeight = netWeight || calculatedNetWeight;
                    
                    return displayWeight ? (
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span className="text-muted-foreground">Net Weight:</span>
                        <span className="font-medium">
                          {displayWeight.toFixed(3)}g
                          {calculatedNetWeight && (
                            <span className="text-xs text-muted-foreground ml-1">(calculated)</span>
                          )}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  
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
                  {(extractedData.color || (jewelryType === "diamond" && !extractedData.color)) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">
                        {extractedData.color || "H-I"}
                        {!extractedData.color && <span className="text-xs text-muted-foreground ml-1">(default)</span>}
                      </span>
                    </div>
                  )}
                  
                  {/* Diamond Clarity */}
                  {(extractedData.clarity || (jewelryType === "diamond" && !extractedData.clarity)) && (
                    <div className="flex justify-between p-2 bg-background rounded">
                      <span className="text-muted-foreground">Clarity:</span>
                      <span className="font-medium">
                        {extractedData.clarity || "SI"}
                        {!extractedData.clarity && <span className="text-xs text-muted-foreground ml-1">(default)</span>}
                      </span>
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

              {/* Questions for Missing Compulsory Details */}
              {(() => {
                // Check if net weight can be calculated from gross weight - diamond weight
                const canCalculateNetWeight = !!(
                  (extractedData.totalWeight || extractedData.grossWeight) &&
                  (extractedData.diamondWeight || 
                   (extractedData.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0))
                );
                
                const needsNetWeightInput = !(extractedData.weight || extractedData.netWeight) && !canCalculateNetWeight;
                const showMissingDetails = !extractedData.carat || needsNetWeightInput;
                
                return showMissingDetails ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-base text-orange-600">Missing Information</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please provide the following details to continue
                      </p>
                    </div>

                    {/* Missing Purity/Carat */}
                    {!extractedData.carat && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
                          <span className="text-xs sm:text-sm font-bold text-white">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                            Select Purity of Jewelry
                          </Label>
                          <RadioGroup
                            value={missingDetails.carat || ""}
                            onValueChange={(value) =>
                              setMissingDetails((prev) => ({
                                ...prev,
                                carat: value,
                              }))
                            }
                            className="grid grid-cols-3 gap-2 sm:gap-3"
                          >
                            {["22K", "18K", "14K"].map((purity) => (
                              <div key={purity}>
                                <RadioGroupItem value={purity} id={`purity-${purity}`} className="sr-only peer" />
                                <Label
                                  htmlFor={`purity-${purity}`}
                                  className={cn(
                                    "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                    "peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500 peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-md",
                                    "hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                  )}
                                >
                                  <div className={cn(
                                    "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    missingDetails.carat === purity
                                      ? "border-white bg-white"
                                      : "border-muted-foreground"
                                  )}>
                                    {missingDetails.carat === purity && (
                                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    )}
                                  </div>
                                  <span className="font-bold text-sm sm:text-base">{purity}</span>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Net Weight - Only show if it can't be calculated */}
                  {needsNetWeightInput && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
                          <span className="text-xs sm:text-sm font-bold text-white">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                            Enter Net Weight (in grams)
                          </Label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 10.5"
                              value={missingDetails.netWeight || ""}
                              onChange={(e) =>
                                setMissingDetails((prev) => ({
                                  ...prev,
                                  netWeight: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              className="w-full p-3 sm:p-4 pr-12 rounded-lg border-2 border-orange-300 dark:border-orange-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-background text-foreground font-medium"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                              g
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Enter the net weight of gold/diamond in the jewelry
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Diamond Color - Only for Diamond Jewelry */}
                  {jewelryType === "diamond" && !extractedData.color && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                          <Diamond className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                            Select Diamond Color
                          </Label>
                          <select
                            value={missingDetails.color || ""}
                            onChange={(e) =>
                              setMissingDetails((prev) => ({
                                ...prev,
                                color: e.target.value,
                              }))
                            }
                            className="w-full p-3 sm:p-4 rounded-lg border-2 border-secondary/30 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-background text-foreground font-medium"
                          >
                            <option value="">Select color...</option>
                            <option value="D">D (Colorless)</option>
                            <option value="E">E (Colorless)</option>
                            <option value="F">F (Colorless)</option>
                            <option value="G">G (Near Colorless)</option>
                            <option value="H">H (Near Colorless)</option>
                            <option value="I">I (Near Colorless)</option>
                            <option value="J">J (Near Colorless)</option>
                            <option value="K">K (Faint Yellow)</option>
                            <option value="L">L (Faint Yellow)</option>
                            <option value="M">M (Faint Yellow)</option>
                          </select>
                          <p className="text-xs text-muted-foreground mt-2">
                            If unsure, color will default to "H-I" for pricing
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Diamond Clarity - Only for Diamond Jewelry */}
                  {jewelryType === "diamond" && !extractedData.clarity && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                          <Diamond className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                            Select Diamond Clarity
                          </Label>
                          <select
                            value={missingDetails.clarity || ""}
                            onChange={(e) =>
                              setMissingDetails((prev) => ({
                                ...prev,
                                clarity: e.target.value,
                              }))
                            }
                            className="w-full p-3 sm:p-4 rounded-lg border-2 border-secondary/30 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all bg-background text-foreground font-medium"
                          >
                            <option value="">Select clarity...</option>
                            <option value="FL">FL (Flawless)</option>
                            <option value="IF">IF (Internally Flawless)</option>
                            <option value="VVS1">VVS1 (Very Very Slightly Included)</option>
                            <option value="VVS2">VVS2 (Very Very Slightly Included)</option>
                            <option value="VS1">VS1 (Very Slightly Included)</option>
                            <option value="VS2">VS2 (Very Slightly Included)</option>
                            <option value="SI1">SI1 (Slightly Included)</option>
                            <option value="SI2">SI2 (Slightly Included)</option>
                            <option value="I1">I1 (Included)</option>
                            <option value="I2">I2 (Included)</option>
                            <option value="I3">I3 (Included)</option>
                          </select>
                          <p className="text-xs text-muted-foreground mt-2">
                            If unsure, clarity will default to "SI" for pricing
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null;
              })()}

              {/* Questions based on jewelry type */}
              {jewelryType === "gold" ? (
                <div className="space-y-4">
                  {/* Question 1: Buy Back Guarantee */}
                  <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-primary">1</span>
                      </div>
                      <div className="flex-1 min-w-0">
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
                          className="grid grid-cols-2 gap-2 sm:gap-3"
                        >
                          <div>
                            <RadioGroupItem value="true" id="buyback-yes" className="sr-only peer" />
                            <Label
                              htmlFor="buyback-yes"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.buyBackGuarantee === true
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.buyBackGuarantee === true && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">Yes</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="false" id="buyback-no" className="sr-only peer" />
                            <Label
                              htmlFor="buyback-no"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.buyBackGuarantee === false
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.buyBackGuarantee === false && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">No</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Raw Form */}
                  <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-primary">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
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
                          className="grid grid-cols-2 gap-2 sm:gap-3"
                        >
                          <div>
                            <RadioGroupItem value="true" id="rawform-yes" className="sr-only peer" />
                            <Label
                              htmlFor="rawform-yes"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.showsRawForm === true
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.showsRawForm === true && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">Yes</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="false" id="rawform-no" className="sr-only peer" />
                            <Label
                              htmlFor="rawform-no"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-primary/50 hover:bg-primary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.showsRawForm === false
                                  ? "border-primary-foreground bg-primary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.showsRawForm === false && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">No</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Question 1: Diamond Appreciation */}
                  <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-secondary">1</span>
                      </div>
                      <div className="flex-1 min-w-0">
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
                          className="grid grid-cols-2 gap-2 sm:gap-3"
                        >
                          <div>
                            <RadioGroupItem value="true" id="appreciation-yes" className="sr-only peer" />
                            <Label
                              htmlFor="appreciation-yes"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-secondary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-secondary/50 hover:bg-secondary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.diamondAppreciation === true
                                  ? "border-secondary-foreground bg-secondary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.diamondAppreciation === true && (
                                  <div className="w-2 h-2 rounded-full bg-secondary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">Yes</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="false" id="appreciation-no" className="sr-only peer" />
                            <Label
                              htmlFor="appreciation-no"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-secondary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-secondary/50 hover:bg-secondary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.diamondAppreciation === false
                                  ? "border-secondary-foreground bg-secondary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.diamondAppreciation === false && (
                                  <div className="w-2 h-2 rounded-full bg-secondary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">No</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Certificate Type */}
                  <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-secondary/5 to-secondary/10 border-2 border-secondary/20 rounded-xl shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs sm:text-sm font-bold text-secondary">2</span>
                      </div>
                      <div className="flex-1 min-w-0">
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
                          className="grid grid-cols-1 gap-2 sm:gap-3"
                        >
                          <div>
                            <RadioGroupItem value="IGI" id="cert-igi" className="sr-only peer" />
                            <Label
                              htmlFor="cert-igi"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-secondary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-secondary/50 hover:bg-secondary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.certificationType === "IGI"
                                  ? "border-secondary-foreground bg-secondary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.certificationType === "IGI" && (
                                  <div className="w-2 h-2 rounded-full bg-secondary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">IGI Certified</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="Non-IGI" id="cert-non-igi" className="sr-only peer" />
                            <Label
                              htmlFor="cert-non-igi"
                              className={cn(
                                "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all",
                                "peer-data-[state=checked]:border-secondary peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:text-secondary-foreground peer-data-[state=checked]:shadow-md",
                                "hover:border-secondary/50 hover:bg-secondary/5"
                              )}
                            >
                              <div className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                verificationAnswers.certificationType === "Non-IGI"
                                  ? "border-secondary-foreground bg-secondary-foreground"
                                  : "border-muted-foreground"
                              )}>
                                {verificationAnswers.certificationType === "Non-IGI" && (
                                  <div className="w-2 h-2 rounded-full bg-secondary" />
                                )}
                              </div>
                              <span className="font-medium text-sm sm:text-base">Non-IGI (Self Certified)</span>
                            </Label>
                          </div>
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