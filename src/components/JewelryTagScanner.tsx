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
  ChevronUp,
  ChevronDown,
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
import { useUserVerification } from "@/contexts/UserVerificationContext";

type JewelleryType = "gold" | "diamond" | null;
type Certification = "IGI" | "Non-IGI";
type GoldType = "chains" | "plain" | "temple" | "italian";

interface ExtractedData {
  weight?: number;
  carat?: string;
  diamondWeight?: number;
  stoneWeight?: number;
  kundanWeight?: number;
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

interface ScanResult {
  JewelleryType: JewelleryType;
  extractedData: ExtractedData;
  verificationAnswers: VerificationAnswers;
  makingCharges: MakingCharges;
  calculatedPrice: number;
  priceBreakdown: PriceBreakdown;
}

interface JewelleryTagScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
  embedded?: boolean; // New prop to control if it's embedded or modal
}

export function JewelleryTagScanner({
  onScanComplete,
  onClose,
  embedded = false,
}: JewelleryTagScannerProps) {
  const [step, setStep] = useState(1);
  const [JewelleryType, setJewelleryType] = useState<JewelleryType>(null);
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
  const [expandedSide, setExpandedSide] = useState<"top" | "bottom" | null>(null);
  
  // State for missing compulsory details
  const [missingDetails, setMissingDetails] = useState<{
    carat?: string;
    netWeight?: number;
    diamondWeight?: number;
    color?: string;
    clarity?: string;
  }>({});
  
  const { toast } = useToast();
  const { goldRates, diamondRates, makingCharges } = useRates();
  const { isVerifiedUser, openVerificationModal } = useUserVerification();
  
  // Refs for camera inputs and video
  const topCameraInputRef = useRef<HTMLInputElement>(null);
  const bottomCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-set making charges for diamond Jewellery when diamond type is selected
  useEffect(() => {
    if (JewelleryType === "diamond" && !makingChargesData.percentage) {
      setMakingChargesData({ percentage: 800 });
    }
  }, [JewelleryType, makingChargesData.percentage]);

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
    if (!images.top || !images.bottom) {
      toast({
        title: "Missing images",
        description: "Please scan both sides of the tag",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);

    try {
      const data = await extractTextFromImages(
        images.top,
        images.bottom,
        JewelleryType!
      );
      
      // Normalize the extracted data to handle various tag formats
      const normalizedData = normalizeExtractedData(data, JewelleryType!);
      
      setExtractedData(normalizedData);
      setStep(2); // Go to select jewellery type step
      toast({
        title: "Text extracted successfully",
        description:
          "Please select jewellery type",
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
    // Check if user is verified before allowing calculation
    if (!isVerifiedUser) {
      openVerificationModal();
      return;
    }

    if (!JewelleryType || !extractedData) {
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
        diamondWeight: extractedData.diamondWeight || missingDetails.diamondWeight,
        color: extractedData.color || missingDetails.color,
        clarity: extractedData.clarity || missingDetails.clarity,
      };

      console.log('📋 Complete Data for Calculation:', completeData);

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
      let stoneValue = 0;
      let kundanValue = 0;
      let calculatedMakingCharges = 0;
      let goldRate = 0;
      let goldWeightValue = 0;
      let diamondRate = 0;
      let diamondWeightValue = 0;
      let stoneWeightValue = 0;
      let kundanWeightValue = 0;
      let makingChargeRateDisplay: number | string = 0;

      // Calculate stone and kundan prices (applicable for both gold and diamond)
      const stoneWeight = completeData.stoneWeight || 0;
      const kundanWeight = completeData.kundanWeight || 0;
      
      console.log('💎 Stone & Kundan Calculation:', {
        stoneWeight,
        kundanWeight,
        stoneRate: 800,
        kundanRate: 200
      });
      
      if (stoneWeight > 0) {
        stoneWeightValue = stoneWeight;
        stoneValue = stoneWeight * 800; // ₹800 per gram
        console.log('✅ Stone value calculated:', stoneValue);
      }
      
      if (kundanWeight > 0) {
        kundanWeightValue = kundanWeight;
        kundanValue = kundanWeight * 200; // ₹200 per gram
        console.log('✅ Kundan value calculated:', kundanValue);
      }

      if (JewelleryType === "gold") {
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
      } else if (JewelleryType === "diamond") {
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
            title: "Missing diamond weight",
            description: "Please enter diamond weight in the missing details section.",
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

      const subTotal = goldValue + diamondValue + stoneValue + kundanValue + calculatedMakingCharges;
      const finalPrice = subTotal; // No GST - final price is same as subtotal

      // Determine display values for diamond color and clarity
      const displayColor = completeData.color || (JewelleryType === "diamond" ? "H-I" : undefined);
      const displayClarity = completeData.clarity || (JewelleryType === "diamond" ? "SI" : undefined);

      const breakdown: PriceBreakdown = {
        goldRate,
        goldWeight: goldWeightValue,
        goldValue,
        diamondRate: diamondRate > 0 ? diamondRate : undefined,
        diamondWeight: diamondWeightValue > 0 ? diamondWeightValue : undefined,
        diamondValue,
        diamondColor: displayColor,
        diamondClarity: displayClarity,
        stoneWeight: stoneWeightValue > 0 ? stoneWeightValue : undefined,
        stoneValue,
        kundanWeight: kundanWeightValue > 0 ? kundanWeightValue : undefined,
        kundanValue,
        makingChargeRate: makingChargeRateDisplay,
        makingCharges: calculatedMakingCharges,
        subTotal,
        gst: 0, // No GST
        finalPrice,
      };

      console.log('💰 Price Breakdown:', breakdown);

      setCalculatedPrice(finalPrice);
      setPriceBreakdown(breakdown);
      
      // Complete directly without showing step 5
      const result: ScanResult = {
        JewelleryType,
        extractedData,
        verificationAnswers,
        makingCharges: makingChargesData,
        calculatedPrice: breakdown.finalPrice,
        priceBreakdown: breakdown,
      };

      onScanComplete(result);
      
      // Only close if not embedded (modal mode)
      if (!embedded) {
        onClose();
      }

      toast({
        title: "Scan complete!",
        description: "Jewellery tag scanned and price calculated successfully.",
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

  const canProceedToStep2 = images.top !== null && images.bottom !== null; // Both images required
  const canProceedToStep3 = 
    JewelleryType !== null &&
    (JewelleryType === "gold"
      ? makingChargesData.goldType !== undefined && makingChargesData.percentage !== undefined
      : true); // Diamond Jewellery auto-sets making charges, no manual input needed
  
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
  
  // Check if diamond weight is available (only for diamond jewellery)
  const hasDiamondWeight = JewelleryType !== "diamond" || !!(
    extractedData?.diamondWeight ||
    (extractedData?.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0)
  );
  
  const hasMissingDetails = !extractedData?.carat || !hasNetWeight || !hasDiamondWeight;
  const missingDetailsFilled = 
    (!extractedData?.carat ? !!missingDetails.carat : true) &&
    (!hasNetWeight ? !!missingDetails.netWeight : true) &&
    (!hasDiamondWeight ? !!missingDetails.diamondWeight : true);
  
  const canCalculate =
    (!hasMissingDetails || missingDetailsFilled) &&
    (JewelleryType === "gold"
      ? verificationAnswers.buyBackGuarantee !== undefined &&
        verificationAnswers.showsRawForm !== undefined
      : verificationAnswers.diamondAppreciation !== undefined &&
        verificationAnswers.certificationType !== undefined);

  // Calculate progress percentage for each step bar
  const getStepProgress = (stepNumber: number) => {
    if (stepNumber < step) {
      // Completed steps: 100%
      return 100;
    } else if (stepNumber === step) {
      // Current step
      if (step === 1) {
        // Step 1: 5% base, +45% for each image
        const baseProgress = 5;
        const imagesUploaded = (images.top ? 1 : 0) + (images.bottom ? 1 : 0);
        return baseProgress + (imagesUploaded * 45);
      } else {
        // Step 2 or 3: Start at 5%
        return 5;
      }
    } else {
      // Future steps: 0%
      return 0;
    }
  };

  // Scanner content component
  const scannerContent = (
    <Card className="w-full shadow-2xl">
      <CardHeader className="relative border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                {step === 1 ? "Step 1-Scan" : step === 2 ? "Step 2-Select" : "Step 3-Verify"}
              </CardTitle>
            </div>
          </div>
          {!embedded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Three Progress Bars in Same Line */}
        <div className="mt-6 space-y-3">
          {/* Step Labels */}
          <div className="flex items-center justify-between gap-4 px-1">
            <span className={cn(
              "text-sm font-medium transition-colors text-gray-400",
            )}>
              Step 1-Scan
            </span>
            <span className={cn(
              "text-sm font-medium transition-colors text-gray-400",
            )}>
              Step 2-Select
            </span>
            <span className={cn(
              "text-sm font-medium transition-colors text-gray-400",
            )}>
              Step 3-Verify
            </span>
          </div>
          
          {/* Progress Bars */}
          <div className="flex items-center gap-2">
            {/* Step 1 Bar */}
            <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out bg-[#8B7355]",
                )}
                style={{ width: `${getStepProgress(1)}%` }}
              />
            </div>

            {/* Step 2 Bar */}
            <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out bg-[#8B7355]"
                )}
                style={{ width: `${getStepProgress(2)}%` }}
              />
            </div>

            {/* Step 3 Bar */}
            <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out bg-[#8B7355]"
                )}
                style={{ width: `${getStepProgress(3)}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Step 1: Scan both sides of tag */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h1 className="text-3xl sm:text-4xl font-serif text-center">
                Scan both sides of tag
              </h1>

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
                            Capture {activeCamera === "top" ? "Side 1" : "Side 2"}
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
                  </div>
                </div>
              )}

              {/* Side 1 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Side 1</h2>
                <Card className="relative bg-[#E5DDD5] border-0 rounded-3xl overflow-hidden min-h-[280px] flex items-center justify-center">
                  {imagePreviews.top ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreviews.top}
                        alt="Side 1"
                        className="w-full h-full object-contain p-4"
                      />
                      <button
                        onClick={() => handleRemoveImage("top")}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white"
                      >
                        <X className="h-5 w-5 text-gray-600" />
                      </button>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startCamera("top")}
                      className="flex flex-col items-center justify-center gap-3 py-16 w-full"
                    >
                      <Camera className="h-12 w-12 text-gray-700" />
                      <span className="text-base font-medium text-gray-900">
                        Click here to scan tag<br />(Side 1)
                      </span>
                    </button>
                  )}
                </Card>

                {/* Side 1 extracted data */}
                {extractedData && imagePreviews.top && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSide(expandedSide === "top" ? null : "top")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <span className="font-medium">View Extracted Data</span>
                      {expandedSide === "top" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    {expandedSide === "top" && (
                      <div className="px-4 py-3 bg-gray-50 space-y-2 border-t">
                        {(extractedData.totalWeight || extractedData.grossWeight) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Weight</span>
                            <span className="font-semibold">{extractedData.totalWeight || extractedData.grossWeight}g</span>
                          </div>
                        )}
                        {(extractedData.weight || extractedData.netWeight) && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Net Weight</span>
                            <span className="font-semibold">{extractedData.weight || extractedData.netWeight}g</span>
                          </div>
                        )}
                        {extractedData.carat && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Purity</span>
                            <span className="font-semibold">{extractedData.carat}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Side 2 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Side 2</h2>
                <Card className="relative bg-[#E5DDD5] border-0 rounded-3xl overflow-hidden min-h-[280px] flex items-center justify-center">
                  {imagePreviews.bottom ? (
                    <div className="relative w-full h-full">
                      <img
                        src={imagePreviews.bottom}
                        alt="Side 2"
                        className="w-full h-full object-contain p-4"
                      />
                      <button
                        onClick={() => handleRemoveImage("bottom")}
                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white"
                      >
                        <X className="h-5 w-5 text-gray-600" />
                      </button>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startCamera("bottom")}
                      className="flex flex-col items-center justify-center gap-3 py-16 w-full"
                    >
                      <Camera className="h-12 w-12 text-gray-700" />
                      <span className="text-base font-medium text-gray-900">
                        Scan Tag with Camera
                      </span>
                    </button>
                  )}
                </Card>

                {/* Side 2 extracted data */}
                {extractedData && imagePreviews.bottom && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedSide(expandedSide === "bottom" ? null : "bottom")}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white"
                    >
                      <span className="font-medium">View Extracted Data</span>
                      {expandedSide === "bottom" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    {expandedSide === "bottom" && (
                      <div className="px-4 py-3 bg-gray-50 space-y-2 border-t">
                        {extractedData.stoneWeight && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stone Weight</span>
                            <span className="font-semibold">{extractedData.stoneWeight}g</span>
                          </div>
                        )}
                        {extractedData.kundanWeight && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kundan Weight</span>
                            <span className="font-semibold">{extractedData.kundanWeight}g</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload from gallery option */}
              <button
                onClick={() => {
                  if (!imagePreviews.top) {
                    topCameraInputRef.current?.click();
                  } else if (!imagePreviews.bottom) {
                    bottomCameraInputRef.current?.click();
                  }
                }}
                className="w-full py-4 border-2 border-green-500 text-green-600 rounded-xl font-medium hover:bg-green-50 transition-colors"
              >
                Or upload image from gallery
              </button>

              <input
                ref={topCameraInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("top", file);
                }}
              />
              <input
                ref={bottomCameraInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("bottom", file);
                }}
              />

              {isExtracting && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="font-semibold text-primary">Extracting Text...</p>
                  </div>
                </div>
              )}

              {/* Next button */}
              <Button
                onClick={handleExtractText}
                disabled={!canProceedToStep2 || isExtracting}
                className="w-full py-6 bg-[#8B7355] hover:bg-[#7A6349] text-white rounded-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? "Extracting..." : "Next"}
              </Button>
            </div>
          )}

          {/* Step 2: Select jewellery type */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h1 className="text-3xl sm:text-4xl font-serif text-center">
                Select jewellery type
              </h1>

              <RadioGroup
                value={JewelleryType === "gold" ? (makingChargesData.goldType || "") : (JewelleryType === "diamond" ? "diamond" : "")}
                onValueChange={(value) => {
                  if (value === "diamond") {
                    setJewelleryType("diamond");
                    setMakingChargesData({
                      goldType: undefined,
                      percentage: 800,
                    });
                  } else {
                    setJewelleryType("gold");
                    const type = value as GoldType;
                    const rates = {
                      chains: makingCharges.chains || 2.5,
                      plain: makingCharges.plain || 3.5,
                      temple: makingCharges.temple || 7,
                      italian: makingCharges.italianGold || 18
                    };
                    setMakingChargesData({
                      goldType: type,
                      percentage: rates[type],
                    });
                  }
                }}
                className="space-y-6"
              >
                {/* Gold Jewellery */}
                <Card className="bg-[#E5DDD5] border-0 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">Gold Jewellery</h2>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {[
                      { value: 'chains', label: 'Chains', rate: makingCharges.chains },
                      { value: 'plain', label: 'Plain', rate: makingCharges.plain },
                      { value: 'temple', label: 'Temple/Antique', rate: makingCharges.temple },
                      { value: 'italian', label: 'Italian Gold', rate: makingCharges.italianGold }
                    ].map((type) => {
                      const isSelected = JewelleryType === "gold" && makingChargesData.goldType === type.value;
                      return (
                        <div
                          key={type.value}
                          className={cn(
                            "relative flex items-center justify-between px-3 sm:px-4 py-4 sm:py-6 rounded-xl sm:rounded-2xl cursor-pointer transition-all border-2",
                            isSelected
                              ? "bg-[#8B7355] text-white border-[#8B7355]"
                              : "bg-white text-gray-900 border-white"
                          )}
                          onClick={() => {
                            setJewelleryType("gold");
                            const goldType = type.value as GoldType;
                            const rates = {
                              chains: makingCharges.chains,
                              plain: makingCharges.plain,
                              temple: makingCharges.temple,
                              italian: makingCharges.italianGold
                            };
                            setMakingChargesData({
                              goldType,
                              percentage: rates[goldType],
                            });
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base sm:text-lg truncate">{type.label}</div>
                            <div className={cn(
                              "text-xs sm:text-sm",
                              isSelected ? "text-white/80" : "text-gray-500"
                            )}>
                              {type.rate}% making
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2",
                            isSelected
                              ? "border-white bg-transparent"
                              : "border-gray-300 bg-white"
                          )}>
                            {isSelected && (
                              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white" />
                            )}
                          </div>
                          <RadioGroupItem
                            value={type.value}
                            className="sr-only"
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Diamond Jewellery */}
                <Card
                  className={cn(
                    "border-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 cursor-pointer transition-colors",
                    JewelleryType === "diamond"
                      ? "bg-[#8B7355] text-white border-[#8B7355]"
                      : "bg-white border-[#E5DDD5]"
                  )}
                  onClick={() => {
                    setJewelleryType("diamond");
                    setMakingChargesData({
                      goldType: undefined,
                      percentage: 800,
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <h2 className="text-xl sm:text-2xl font-serif mb-1 sm:mb-2">Diamond Jewellery</h2>
                      <p className={cn(
                        "text-xs sm:text-sm",
                        JewelleryType === "diamond" ? "text-white/80" : "text-gray-500"
                      )}>
                        Any type of diamond jewellery
                      </p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      JewelleryType === "diamond"
                        ? "border-white bg-transparent"
                        : "border-gray-300 bg-white"
                    )}>
                      {JewelleryType === "diamond" && (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white" />
                      )}
                    </div>
                    <RadioGroupItem
                      value="diamond"
                      className="sr-only"
                    />
                  </div>
                </Card>
              </RadioGroup>

              {/* Navigation buttons */}
              <div className="flex gap-3 sm:gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="flex-1 py-4 sm:py-6 bg-[#8B7355] hover:bg-[#7A6349] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-base sm:text-lg font-medium"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verification Questions */}
          {step === 3 && extractedData && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h1 className="text-3xl sm:text-4xl font-serif text-center">
                Jeweller Practice
              </h1>

              {/* Questions for Missing Compulsory Details */}
              {(() => {
                // Check if net weight can be calculated from gross weight - diamond weight
                const canCalculateNetWeight = !!(
                  (extractedData.totalWeight || extractedData.grossWeight) &&
                  (extractedData.diamondWeight || 
                   (extractedData.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0))
                );
                
                const needsNetWeightInput = !(extractedData.weight || extractedData.netWeight) && !canCalculateNetWeight;
                
                // Check if diamond weight is missing (for diamond jewellery only)
                const needsDiamondWeightInput = JewelleryType === "diamond" && !(
                  extractedData.diamondWeight ||
                  (extractedData.diamonds && Array.isArray(extractedData.diamonds) && extractedData.diamonds.length > 0)
                );
                
                const showMissingDetails = !extractedData.carat || needsNetWeightInput || needsDiamondWeightInput;
                
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
                            Select Purity of Jewellery
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
                            Enter the net weight of gold/diamond in the Jewellery
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Diamond Weight - Only for Diamond Jewellery */}
                  {needsDiamondWeightInput && (
                    <div className="space-y-3 p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 flex items-center justify-center mt-0.5">
                          <span className="text-xs sm:text-sm font-bold text-white">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm sm:text-base font-semibold leading-relaxed text-foreground block mb-3">
                            Enter Diamond Weight (in carats)
                          </Label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 0.5"
                              value={missingDetails.diamondWeight || ""}
                              onChange={(e) =>
                                setMissingDetails((prev) => ({
                                  ...prev,
                                  diamondWeight: parseFloat(e.target.value) || undefined,
                                }))
                              }
                              className="w-full p-3 sm:p-4 pr-12 rounded-lg border-2 border-orange-300 dark:border-orange-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-background text-foreground font-medium"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                              ct
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Enter the total diamond weight in carats
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Diamond Color - Only for Diamond Jewellery */}
                  {JewelleryType === "diamond" && !extractedData.color && (
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

                  {/* Missing Diamond Clarity - Only for Diamond Jewellery */}
                  {JewelleryType === "diamond" && !extractedData.clarity && (
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

              {/* Jeweller Practice Question */}
              <Card className="bg-[#E5DDD5] border-0 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <p className="text-gray-900 text-sm sm:text-base leading-relaxed">
                    When you look at the back of your jewellery, can you see all the Kundan or stones?
                  </p>
                </div>

                <RadioGroup
                  value={verificationAnswers.showsRawForm?.toString() || ""}
                  onValueChange={(value) =>
                    setVerificationAnswers((prev) => ({
                      ...prev,
                      showsRawForm: value === "true",
                      // Auto-set other required fields for validation
                      buyBackGuarantee: JewelleryType === "gold" ? true : prev.buyBackGuarantee,
                      diamondAppreciation: JewelleryType === "diamond" ? false : prev.diamondAppreciation,
                      certificationType: JewelleryType === "diamond" ? "Non-IGI" : prev.certificationType,
                    }))
                  }
                  className="space-y-3"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all border-2",
                      verificationAnswers.showsRawForm === true
                        ? "bg-[#8B7355] text-white border-[#8B7355]"
                        : "bg-white text-gray-900 border-white"
                    )}
                    onClick={() =>
                      setVerificationAnswers((prev) => ({
                        ...prev,
                        showsRawForm: true,
                        buyBackGuarantee: JewelleryType === "gold" ? true : prev.buyBackGuarantee,
                        diamondAppreciation: JewelleryType === "diamond" ? false : prev.diamondAppreciation,
                        certificationType: JewelleryType === "diamond" ? "Non-IGI" : prev.certificationType,
                      }))
                    }
                  >
                    <span className="text-sm sm:text-base flex-1">All are visible and open from the back.</span>
                    <div className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3",
                      verificationAnswers.showsRawForm === true
                        ? "border-white bg-transparent"
                        : "border-gray-300 bg-white"
                    )}>
                      {verificationAnswers.showsRawForm === true && (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white" />
                      )}
                    </div>
                    <RadioGroupItem
                      value="true"
                      className="sr-only"
                    />
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl cursor-pointer transition-all border-2",
                      verificationAnswers.showsRawForm === false
                        ? "bg-[#8B7355] text-white border-[#8B7355]"
                        : "bg-white text-gray-900 border-white"
                    )}
                    onClick={() =>
                      setVerificationAnswers((prev) => ({
                        ...prev,
                        showsRawForm: false,
                        buyBackGuarantee: JewelleryType === "gold" ? true : prev.buyBackGuarantee,
                        diamondAppreciation: JewelleryType === "diamond" ? false : prev.diamondAppreciation,
                        certificationType: JewelleryType === "diamond" ? "Non-IGI" : prev.certificationType,
                      }))
                    }
                  >
                    <span className="text-sm sm:text-base flex-1">Some are closed or covered from the back.</span>
                    <div className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3",
                      verificationAnswers.showsRawForm === false
                        ? "border-white bg-transparent"
                        : "border-gray-300 bg-white"
                    )}>
                      {verificationAnswers.showsRawForm === false && (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white" />
                      )}
                    </div>
                    <RadioGroupItem
                      value="false"
                      className="sr-only"
                    />
                  </div>
                </RadioGroup>
              </Card>

              {/* Navigation buttons */}
              <div className="flex gap-3 sm:gap-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium border-2"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCalculatePreview}
                  disabled={!canCalculate || isCalculating}
                  className="flex-1 py-4 sm:py-6 bg-[#8B7355] hover:bg-[#7A6349] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-base sm:text-lg font-medium"
                >
                  {isCalculating ? "Calculating..." : "Get Results"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );

  // Return with or without modal wrapper based on embedded prop
  if (embedded) {
    return scannerContent;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {scannerContent}
      </div>
    </div>
  );
}