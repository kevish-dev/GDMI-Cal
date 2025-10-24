import { useState } from "react";
import { Layout } from "@/components/Layout/Layout";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  Phone,
  MessageCircle,
  ImageUp,
  Package,
  BadgeIndianRupee,
} from "lucide-react";
import { JewelleryTagScanner } from "@/components/JewelryTagScanner";
import { UserVerificationModal } from "@/components/UserVerificationModal";
import { useToast } from "@/hooks/use-toast";
import { useRates } from "@/contexts/RatesContext";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();
  const { addCalculation } = useRates();
  const navigate = useNavigate();

  const handleScanComplete = async (result: any) => {
    // Add calculation to analytics
    await addCalculation({
      type: result.JewelleryType as "gold" | "diamond",
      totalValue: result.calculatedPrice,
      goldWeight:
        result.extractedData.weight || result.extractedData.netWeight || 0,
      diamondWeight: result.extractedData.diamondWeight,
      carat: result.extractedData.carat?.toLowerCase(),
      JewelleryType:
        result.JewelleryType === "gold" ? result.extractedData.type : "diamond",
      diamondColor: result.extractedData.color,
      diamondClarity: result.extractedData.clarity,
      certification: result.verificationAnswers?.certificationType,
    });

    toast({
      title: "Scan completed successfully!",
      description: `Price calculated: ₹${result.calculatedPrice.toLocaleString(
        "en-IN"
      )}`,
    });

    // Navigate to results page with data
    navigate("/results", {
      state: {
        jewelryType: result.JewelleryType,
        priceBreakdown: result.priceBreakdown,
        extractedData: result.extractedData,
      },
    });
  };

  const handleCallNow = () => {
    window.open("tel:+919971187600", "_self");
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi, I need help with jewellery price calculation."
    );
    window.open(`https://wa.me/919971187600?text=${message}`, "_blank");
  };

  if (showScanner) {
    return (
      <Layout>
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

  return (
    <Layout>

      {/* Hero Section */}
      <div className="relative flex px-3 sm:px-4 py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-left md:text-left space-y-6 sm:space-y-8 mb-12 sm:mb-16">
            {/* Main Heading */}
            <h1
              className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight px-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              <span className="block text-foreground">Save lakhs, know</span>
              <span className="block text-foreground">the actual price of</span>
              <span className="block text-foreground">any jewellery.</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-lg md:text-xl font-light text-muted-foreground max-w-2xl mx-auto md:mx-0 px-2 leading-relaxed">
              Snap. Scan. See what it's worth. Our smart calculator instantly
              reads your tag and reveals your jewellery's true value.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 sm:gap-4 justify-center md:justify-start items-center px-4 pt-4">
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                className="w-full sm:w-auto bg-[#907F58] hover:bg-[#6D5A42] text-white px-8 py-2 text-base sm:text-lg rounded-lg shadow-lg transition-all"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/calculator")}
                className="w-full sm:w-auto border-2 border-[#907F58] text-[#907F58] hover:bg-[#907F58] hover:text-white px-8 py-2 text-base sm:text-lg rounded-lg transition-all"
              >
                Enter Manually
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section - Full Width */}
      <div className="w-full bg-[#DED9CD] py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-6 sm:px-10 lg:px-16">
          <h2
            className="text-left md:text-left text-5xl sm:text-5xl md:text-6xl mb-12 sm:mb-16 text-[#564C35]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
            }}
          >
            How it works
          </h2>

          <div className="space-y-10 container mx-auto max-w-4xl">
            {/* Step 1 */}
            <div className="flex gap-5 sm:gap-6 items-start">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl">
                  1
                </div>
              </div>
              <div className="flex-1 text-left md:text-left">
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-[#564C35] uppercase tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Scan Tag
                </h3>
                <p className="text-base sm:text-lg text-[#6B6456] leading-relaxed font-light">
                  <span className="block">
                    Upload the front and back of your
                  </span>
                  <span className="block">jewellery tag.</span>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5 sm:gap-6 items-start">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl">
                  2
                </div>
              </div>
              <div className="flex-1 text-left md:text-left">
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-[#564C35] uppercase tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Select Jewellery Type
                </h3>
                <p className="text-base sm:text-lg text-[#6B6456] leading-relaxed font-light">
                  <span className="block">
                    Pick your jewellery type to get accurate{" "}
                  </span>
                  <span className="block">making charges.</span>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5 sm:gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-[#907F58] text-white flex items-center justify-center text-xl sm:text-2xl">
                  3
                </div>
              </div>
              <div className="flex-1 text-left md:text-left">
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-[#564C35] uppercase tracking-wide"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Get Actual Price
                </h3>
                <p className="text-base sm:text-lg text-[#6B6456] leading-relaxed font-light">
                  <span className="block">
                    View your true price based on live gold
                  </span>
                  <span className="block">and diamond rates.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Contact Buttons */}
      <div className="fixed right-2 sm:right-2 bottom-2 sm:bottom-2 z-50 flex flex-col gap-1">
        {/* Phone Button */}
        <button onClick={handleCallNow} aria-label="Call now">
          <svg
            width="56"
            height="56"
            viewBox="0 0 84 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#filter0_d_17_342)">
              <rect
                x="8.3999"
                y="7.3999"
                width="61"
                height="61"
                rx="30.5"
                fill="#564C35"
                shape-rendering="crispEdges"
              />
              <path
                d="M41.7601 30.487C42.8802 30.7056 43.9096 31.2534 44.7165 32.0603C45.5235 32.8673 46.0713 33.8967 46.2899 35.0168M41.7601 25.8999C44.0872 26.1584 46.2573 27.2006 47.914 28.8552C49.5707 30.5098 50.6155 32.6785 50.877 35.0054M49.7302 44.1567V47.597C49.7315 47.9164 49.6661 48.2325 49.5381 48.5252C49.4102 48.8178 49.2225 49.0805 48.9872 49.2964C48.7518 49.5123 48.474 49.6767 48.1714 49.779C47.8689 49.8813 47.5483 49.9193 47.2302 49.8906C43.7014 49.5072 40.3117 48.3013 37.3335 46.37C34.5627 44.6093 32.2135 42.2601 30.4528 39.4893C28.5147 36.4976 27.3086 33.0914 26.9322 29.5467C26.9035 29.2295 26.9412 28.9099 27.0428 28.6082C27.1445 28.3064 27.3078 28.0291 27.5225 27.794C27.7372 27.5588 27.9984 27.3709 28.2897 27.2422C28.581 27.1136 28.8958 27.047 29.2143 27.0467H32.6546C33.2111 27.0412 33.7507 27.2383 34.1727 27.6012C34.5947 27.9641 34.8703 28.4681 34.9482 29.0192C35.0934 30.1201 35.3627 31.2012 35.7509 32.2416C35.9052 32.6521 35.9386 33.0982 35.8471 33.527C35.7557 33.9559 35.5432 34.3495 35.2349 34.6613L33.7785 36.1177C35.411 38.9888 37.7881 41.3659 40.6591 42.9984L42.1156 41.542C42.4274 41.2337 42.821 41.0212 43.2499 40.9297C43.6787 40.8383 44.1248 40.8717 44.5353 41.026C45.5757 41.4142 46.6567 41.6835 47.7577 41.8287C48.3148 41.9073 48.8236 42.1879 49.1872 42.6171C49.5509 43.0463 49.7442 43.5943 49.7302 44.1567Z"
                stroke="#F6FAFD"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_17_342"
                x="-9.72748e-05"
                y="-9.72748e-05"
                width="83.8"
                height="83.8"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feMorphology
                  radius="1"
                  operator="dilate"
                  in="SourceAlpha"
                  result="effect1_dropShadow_17_342"
                />
                <feOffset dx="3" dy="4" />
                <feGaussianBlur stdDeviation="5.2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0.177632 0 0 0 0 0.257567 0 0 0 0.42 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_17_342"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_17_342"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </button>

        {/* WhatsApp Button */}
        <button onClick={handleWhatsApp}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 84 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#filter0_d_17_337)">
              <rect
                x="8.3999"
                y="7.3999"
                width="61"
                height="61"
                rx="30.5"
                fill="#00D95F"
                shape-rendering="crispEdges"
              />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M44.5881 39.9444C44.2562 39.6772 43.8676 39.4891 43.4519 39.3944C43.0362 39.2998 42.6043 39.3012 42.1892 39.3984C41.5655 39.657 41.1625 40.6341 40.7595 41.1227C40.6745 41.2398 40.5496 41.322 40.4083 41.3537C40.2669 41.3854 40.1189 41.3646 39.9918 41.2951C37.7084 40.4023 35.7944 38.7649 34.5608 36.649C34.4555 36.517 34.4057 36.3493 34.4218 36.1814C34.438 36.0134 34.5187 35.8583 34.6471 35.7485C35.0966 35.3043 35.4266 34.7541 35.6067 34.1488C35.6466 33.4811 35.4934 32.816 35.1653 32.2328C34.9116 31.4153 34.4288 30.6873 33.7739 30.1349C33.4362 29.9832 33.0617 29.9324 32.6956 29.9885C32.3295 30.0446 31.9876 30.2052 31.7109 30.451C31.2306 30.8647 30.8494 31.3807 30.5953 31.961C30.3412 32.5412 30.2208 33.171 30.2428 33.8039C30.2443 34.1593 30.2894 34.5132 30.3771 34.8576C30.5999 35.6852 30.9426 36.4759 31.3942 37.2046C31.7201 37.7629 32.0757 38.3033 32.4593 38.8236C33.7063 40.5326 35.2738 41.9836 37.0748 43.0961C37.9785 43.6614 38.9444 44.1211 39.9534 44.466C41.0016 44.9403 42.1588 45.1224 43.3023 44.9929C43.9538 44.8944 44.571 44.6376 45.0998 44.245C45.6285 43.8525 46.0525 43.3362 46.3344 42.7416C46.5001 42.3825 46.5504 41.9809 46.4784 41.5921C46.3056 40.797 45.2405 40.3276 44.5881 39.9444Z"
                fill="#F6FAFD"
              />
              <path
                d="M21.9287 54.8999L24.366 45.8376C22.4004 42.3074 21.7759 38.1879 22.6071 34.2351C23.4383 30.2823 25.6695 26.7613 28.8911 24.3183C32.1128 21.8752 36.1089 20.674 40.1461 20.935C44.1833 21.196 47.9908 22.9017 50.87 25.7391C53.7492 28.5766 55.5068 32.3554 55.8205 36.3822C56.1341 40.409 54.9827 44.4137 52.5775 47.6614C50.1723 50.909 46.6746 53.1819 42.7264 54.0628C38.7781 54.9437 34.644 54.3736 31.0828 52.4571L21.9287 54.8999ZM31.5242 49.0659L32.0903 49.4012C34.6698 50.9276 37.6826 51.5592 40.6592 51.1977C43.6358 50.8362 46.409 49.5018 48.5466 47.4025C50.6842 45.3032 52.0662 42.5569 52.4773 39.5916C52.8883 36.6263 52.3052 33.6085 50.8189 31.0086C49.3326 28.4086 47.0265 26.3726 44.2601 25.2177C41.4937 24.0628 38.4223 23.8539 35.5246 24.6237C32.6269 25.3934 30.0656 27.0985 28.2399 29.4732C26.4142 31.8479 25.4266 34.7589 25.4311 37.7524C25.4286 40.2346 26.1162 42.6687 27.4173 44.7838L27.7724 45.3682L26.4098 50.4262L31.5242 49.0659Z"
                fill="#F6FAFD"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_17_337"
                x="-9.72748e-05"
                y="-9.72748e-05"
                width="83.8"
                height="83.8"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feMorphology
                  radius="1"
                  operator="dilate"
                  in="SourceAlpha"
                  result="effect1_dropShadow_17_337"
                />
                <feOffset dx="3" dy="4" />
                <feGaussianBlur stdDeviation="5.2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0.177632 0 0 0 0 0.257567 0 0 0 0.42 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_17_337"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_17_337"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
        </button>
      </div>

      {/* User Verification Modal */}
      <UserVerificationModal />
    </Layout>
  );
}
