import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { ScanResultsView } from "@/components/ScanResultsView";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface LocationState {
  jewelryType: "gold" | "diamond";
  priceBreakdown: any;
  extractedData: any;
}

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resultsData, setResultsData] = useState<LocationState | null>(null);

  useEffect(() => {
    // Get data from location state
    const state = location.state as LocationState;
    
    if (state && state.priceBreakdown && state.jewelryType) {
      setResultsData(state);
    } else {
      // If no data, redirect to home after a short delay
      const timeout = setTimeout(() => {
        navigate("/");
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [location.state, navigate]);

  const handleGoHome = () => {
    navigate("/");
  };

  const handleScanAnother = () => {
    navigate("/", { state: { openScanner: true } });
  };

  const handleCalculateAnother = () => {
    navigate("/calculator");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {resultsData ? (
          <div className="max-w-4xl mx-auto">
            <ScanResultsView
              JewelleryType={resultsData.jewelryType}
              priceBreakdown={resultsData.priceBreakdown}
              extractedData={resultsData.extractedData}
              onGoHome={handleGoHome}
              onScanAnother={handleScanAnother}
              onCalculateAnother={handleCalculateAnother}
            />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 bg-[#E5DDD5]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-16 w-16 text-[#8B7355] mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  No Results Found
                </h2>
                <p className="text-gray-600 mb-6">
                  We couldn't find any calculation results. Redirecting you to the homepage...
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-[#8B7355] text-white rounded-xl font-medium hover:bg-[#7A6349] transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
