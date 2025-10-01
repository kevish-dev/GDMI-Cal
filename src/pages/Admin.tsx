import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, 
  Upload, 
  TrendingUp, 
  Users, 
  Calculator, 
  FileSpreadsheet,
  Crown,
  Diamond,
  Calendar,
  DollarSign,
  Activity,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRates, type GoldRate, type DiamondRate } from "@/contexts/RatesContext";
import { useNavigate } from "react-router-dom";
import { GoldRateMarquee } from "@/components/GoldRateMarquee";

export default function Admin() {
  const [newGoldRate24K, setNewGoldRate24K] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [makingChargesForm, setMakingChargesForm] = useState({
    chains: "",
    plain: "",
    temple: "",
    italianGold: ""
  });
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { goldRates, updateGoldRates, diamondRates, updateDiamondRates, makingCharges, updateMakingCharges, getAnalytics, systemAnalytics, recentActivities, loading } = useRates();
  const navigate = useNavigate();

  const analytics = getAnalytics();

  // Initialize making charges form when making charges are loaded
  useEffect(() => {
    if (makingCharges) {
      setMakingChargesForm({
        chains: makingCharges.chains.toString(),
        plain: makingCharges.plain.toString(),
        temple: makingCharges.temple.toString(),
        italianGold: makingCharges.italianGold.toString()
      });
    }
  }, [makingCharges]);

  // Conversion factors for different carat gold
  const conversionFactors = {
    "22K": 0.93,
    "18K": 0.76,
    "14K": 0.60
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully."
    });
    navigate("/login");
  };

  const handleGoldRateUpdate = async () => {
    if (!newGoldRate24K) {
      toast({
        title: "Missing information",
        description: "Please enter 24K gold rate.",
        variant: "destructive"
      });
      return;
    }

    const rate24K = parseFloat(newGoldRate24K);
    if (isNaN(rate24K) || rate24K <= 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid positive number.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Calculate rates for all carats based on 24K price
      const updatedRates: GoldRate[] = Object.entries(conversionFactors).map(([carat, factor]) => ({
        carat,
        rate: Math.round(rate24K * factor),
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      
      await updateGoldRates(updatedRates);
      setNewGoldRate24K("");
      
      toast({
        title: "Gold rates updated",
        description: `All gold rates updated based on 24K price of ₹${rate24K}/g`
      });
    } catch (error) {
      console.error('Error updating gold rates:', error);
      toast({
        title: "Update failed",
        description: "Failed to update gold rates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Mock CSV processing with diamond rates update
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      
      // More robust header validation
      const expectedHeaders = ['Color', 'Clarity'];
      const hasColorAndClarity = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );
      
      // Check for price columns (more flexible matching)
      const hasSelfPriceColumn = headers.some(h => 
        h.toLowerCase().includes('non') || 
        h.toLowerCase().includes('self') || 
        h.toLowerCase().includes('certified') && !h.toLowerCase().includes('igi')
      );
      
      const hasIGIPriceColumn = headers.some(h => 
        h.toLowerCase().includes('igi') || 
        h.toLowerCase().includes('igi-certified')
      );
      
      if (!hasColorAndClarity || !hasSelfPriceColumn || !hasIGIPriceColumn) {
        throw new Error(`CSV headers invalid. Found: ${headers.join(', ')}. Expected columns: Color, Clarity, Non-Certified/Self Price, IGI Price`);
      }
      
      // Find the actual column indices
      const colorIndex = headers.findIndex(h => h.toLowerCase().includes('color'));
      const clarityIndex = headers.findIndex(h => h.toLowerCase().includes('clarity'));
      const selfPriceIndex = headers.findIndex(h => 
        (h.toLowerCase().includes('non') || h.toLowerCase().includes('self')) && 
        (h.includes('₹') || h.toLowerCase().includes('per ct'))
      );
      const igiPriceIndex = headers.findIndex(h => 
        h.toLowerCase().includes('igi') && 
        (h.includes('₹') || h.toLowerCase().includes('per ct'))
      );
      
      const parsedRates: DiamondRate[] = [];
      
      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < Math.max(colorIndex, clarityIndex, selfPriceIndex, igiPriceIndex) + 1) {
          console.warn(`Skipping row ${i + 1}: insufficient columns`);
          continue;
        }
        
        const color = values[colorIndex];
        const clarity = values[clarityIndex];
        const nonCertifiedRate = parseFloat(values[selfPriceIndex]);
        const igiCertifiedRate = parseFloat(values[igiPriceIndex]);
        
        // Validate data
        if (!color || !clarity || isNaN(nonCertifiedRate) || isNaN(igiCertifiedRate)) {
          console.warn(`Skipping invalid row ${i + 1}: color="${color}", clarity="${clarity}", selfRate=${nonCertifiedRate}, igiRate=${igiCertifiedRate}`);
          continue;
        }
        
        // Validate rates are positive
        if (nonCertifiedRate <= 0 || igiCertifiedRate <= 0) {
          console.warn(`Skipping row ${i + 1}: rates must be positive numbers`);
          continue;
        }
        
        // Create two entries - one for each certification type
        parsedRates.push({
          color: color.toUpperCase(),
          clarity: clarity.toUpperCase(),
          certification: "Self",
          rate: nonCertifiedRate
        });
        
        parsedRates.push({
          color: color.toUpperCase(),
          clarity: clarity.toUpperCase(),
          certification: "IGI",
          rate: igiCertifiedRate
        });
      }
      
      if (parsedRates.length === 0) {
        throw new Error('No valid diamond rates found in CSV file');
      }
      
      // Replace all existing rates with new ones from CSV
      console.log('Updating diamond rates with:', parsedRates.length, 'entries');
      console.log('Sample rates:', parsedRates.slice(0, 4));
      
      await updateDiamondRates(parsedRates);
      
      // Count unique combinations for better feedback
      const uniqueCombinations = new Set();
      const certificationCounts = { Self: 0, IGI: 0 };
      
      parsedRates.forEach(rate => {
        uniqueCombinations.add(`${rate.color}-${rate.clarity}`);
        certificationCounts[rate.certification as 'Self' | 'IGI']++;
      });
      
      console.log('Successfully updated diamond rates:', {
        totalEntries: parsedRates.length,
        uniqueCombinations: uniqueCombinations.size,
        selfCertified: certificationCounts.Self,
        igiCertified: certificationCounts.IGI
      });
      
      toast({
        title: "Diamond rates updated successfully!",
        description: `Processed ${file.name}: ${uniqueCombinations.size} color/clarity combinations (${certificationCounts.Self} Self + ${certificationCounts.IGI} IGI certified rates).`,
      });
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      
      let errorMessage = "Failed to process CSV file. Please check the format.";
      
      if (error instanceof Error) {
        if (error.message.includes('headers invalid')) {
          errorMessage = error.message;
        } else if (error.message.includes('must have at least')) {
          errorMessage = "CSV file is empty or has no data rows.";
        } else if (error.message.includes('No valid diamond rates')) {
          errorMessage = "No valid diamond rates found. Please check that all rows have valid Color, Clarity, and price values.";
        } else if (error.message.includes('Error creating/updating')) {
          errorMessage = "Failed to save diamond rates to database. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "CSV Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleMakingChargesUpdate = async () => {
    // Validate all fields
    const charges = {
      chains: parseFloat(makingChargesForm.chains),
      plain: parseFloat(makingChargesForm.plain),
      temple: parseFloat(makingChargesForm.temple),
      italianGold: parseFloat(makingChargesForm.italianGold)
    };

    // Check if all values are valid numbers
    if (Object.values(charges).some(value => isNaN(value) || value < 0)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid positive numbers for all making charges.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await updateMakingCharges(charges);
      
      toast({
        title: "Making charges updated",
        description: "All making charges have been updated successfully."
      });
    } catch (error) {
      console.error('Error updating making charges:', error);
      toast({
        title: "Update failed",
        description: "Failed to update making charges. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove the mock statistics section since we're now using real data from context

  return (
    <Layout>
      <GoldRateMarquee />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-foreground mb-1">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage rates and monitor system activity
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1.5">
              <Activity className="h-4 w-4 mr-2" />
              {user?.username}
            </Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Calculations</p>
                    <p className="text-2xl font-semibold">{analytics.totalCalculations.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gold Calculations</p>
                    <p className="text-2xl font-semibold">{analytics.goldCalculations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Diamond className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diamond Calculations</p>
                    <p className="text-2xl font-semibold">{analytics.diamondCalculations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Value</p>
                    <p className="text-2xl font-semibold">₹{(analytics.avgValue / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="rates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
              <TabsTrigger value="rates" className="flex items-center space-x-2 data-[state=active]:bg-background">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Gold Rates</span>
                <span className="sm:hidden">Gold</span>
              </TabsTrigger>
              <TabsTrigger value="diamonds" className="flex items-center space-x-2 data-[state=active]:bg-background">
                <Diamond className="h-4 w-4" />
                <span className="hidden sm:inline">Diamond Rates</span>
                <span className="sm:hidden">Diamond</span>
              </TabsTrigger>
              <TabsTrigger value="making" className="flex items-center space-x-2 data-[state=active]:bg-background">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Making Charges</span>
                <span className="sm:hidden">Making</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-background">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            {/* Gold Rates Tab */}
            <TabsContent value="rates" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Current Rates */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <span>Current Gold Rates</span>
                      </CardTitle>
                      <CardDescription>
                        Live gold rates per gram by carat
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {goldRates.map((rate, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="font-medium">{rate.carat} Gold</p>
                              <p className="text-sm text-muted-foreground">
                                Updated: {rate.lastUpdated}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">₹{rate.rate.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">per gram</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Update Rates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Update Rates</span>
                    </CardTitle>
                    <CardDescription>
                      Enter 24K rate to update all carat rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate24k">24K Gold Rate (₹/g)</Label>
                      <Input
                        id="rate24k"
                        type="number"
                        placeholder="Enter rate"
                        value={newGoldRate24K}
                        onChange={(e) => setNewGoldRate24K(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Auto-calculated rates:
                      </p>
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        <div>22K = 93%</div>
                        <div>18K = 76%</div>
                        <div>14K = 60%</div>
                      </div>
                    </div>

                    <Button
                      onClick={handleGoldRateUpdate}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? "Updating..." : "Update Rates"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Diamond Rates Tab */}
            <TabsContent value="diamonds" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Diamond className="h-5 w-5 text-blue-500" />
                      <span>Upload Diamond Rates</span>
                    </CardTitle>
                    <CardDescription>
                      Import diamond rates via CSV file
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-2">Upload CSV File</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a CSV file containing diamond rates
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                        disabled={isUploading}
                      />
                      <Button
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        disabled={isUploading}
                        variant="outline"
                      >
                        {isUploading ? "Processing..." : "Select File"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CSV Format</CardTitle>
                    <CardDescription>Required columns and values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm">Required CSV Columns</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>1. Color</div>
                          <div>2. Clarity</div>
                          <div>3. Non‑Certified / Self (₹ per ct)</div>
                          <div>4. IGI‑Certified (₹ per ct)</div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Color Options</p>
                        <p className="text-sm text-muted-foreground">KL, JK, IJ, HI, GH</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Clarity Grades</p>
                        <p className="text-sm text-muted-foreground">I1/I2/I3, SI1, SI2, VS1, VS2, VVS1, VVS2</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Sample Format</p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                          Color,Clarity,Non‑Certified / Self (₹ per ct),IGI‑Certified (₹ per ct)<br/>
                          GH,VVS1,32333,51332
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Diamond Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Diamond Rates</CardTitle>
                  <CardDescription>All active diamond rates in the system ({diamondRates.length} rates)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {diamondRates.map((rate, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{rate.color} - {rate.clarity}</p>
                            <p className="text-xs text-muted-foreground">{rate.certification}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            ₹{rate.rate.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {diamondRates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Diamond className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No diamond rates available. Upload a CSV file to add rates.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Making Charges Tab */}
            <TabsContent value="making" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Current Making Charges */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-slate-500" />
                        <span>Current Making Charges</span>
                      </CardTitle>
                      <CardDescription>
                        Making charges by jewelry type (% of gold value)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Chains</p>
                            <p className="text-sm text-muted-foreground">Basic chain jewelry</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{makingCharges.chains}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Plain Jewelry</p>
                            <p className="text-sm text-muted-foreground">Simple designs</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{makingCharges.plain}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Temple Jewelry</p>
                            <p className="text-sm text-muted-foreground">Traditional designs</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{makingCharges.temple}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Italian Gold</p>
                            <p className="text-sm text-muted-foreground">Premium craftsmanship</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{makingCharges.italianGold}%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Update Making Charges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Update Charges</span>
                    </CardTitle>
                    <CardDescription>
                      Update making charge percentages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="chains">Chains (%)</Label>
                        <Input
                          id="chains"
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={makingChargesForm.chains}
                          onChange={(e) => setMakingChargesForm(prev => ({ ...prev, chains: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plain">Plain (%)</Label>
                        <Input
                          id="plain"
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={makingChargesForm.plain}
                          onChange={(e) => setMakingChargesForm(prev => ({ ...prev, plain: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="temple">Temple (%)</Label>
                        <Input
                          id="temple"
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={makingChargesForm.temple}
                          onChange={(e) => setMakingChargesForm(prev => ({ ...prev, temple: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="italianGold">Italian Gold (%)</Label>
                        <Input
                          id="italianGold"
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={makingChargesForm.italianGold}
                          onChange={(e) => setMakingChargesForm(prev => ({ ...prev, italianGold: e.target.value }))}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleMakingChargesUpdate}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? "Updating..." : "Update Charges"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Rate Management Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <span>Rate Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gold Rates</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{goldRates.length} types</span>
                        <p className="text-xs text-muted-foreground">
                          Last: {goldRates[0]?.lastUpdated || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Diamond Rates</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{diamondRates.length} rates</span>
                        <p className="text-xs text-muted-foreground">Active rates</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Making Charges</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">4 types</span>
                        <p className="text-xs text-muted-foreground">
                          {makingCharges.chains}% - {makingCharges.italianGold}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculation Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span>Usage Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">Gold Jewelry</span>
                          </div>
                          <span className="text-sm font-medium">{analytics.goldCalculations}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full" 
                            style={{ width: `${analytics.totalCalculations > 0 ? (analytics.goldCalculations / analytics.totalCalculations) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center space-x-2">
                            <Diamond className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Diamond Jewelry</span>
                          </div>
                          <span className="text-sm font-medium">{analytics.diamondCalculations}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${analytics.totalCalculations > 0 ? (analytics.diamondCalculations / analytics.totalCalculations) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {recentActivities.length > 0 ? (
                        recentActivities.map((activity, index) => (
                          <div key={activity.id || index} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                            <div className={`w-2 h-2 rounded-full ${
                              activity.type === 'rates' ? 'bg-blue-500' :
                              activity.type === 'system' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.timestamp && activity.timestamp.toDate ? 
                                  new Date(activity.timestamp.toDate()).toLocaleString() :
                                  'Just now'
                                }
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent activities</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Rates Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Rates Summary</CardTitle>
                  <CardDescription>Comprehensive overview of all active rates and pricing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Gold Rates Summary */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center space-x-2 text-base">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <span>Gold Rates</span>
                      </h4>
                      <div className="space-y-3">
                        {goldRates.map((rate, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                            <div>
                              <span className="font-medium text-sm">{rate.carat}</span>
                              <p className="text-xs text-muted-foreground">Gold</p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-sm">₹{rate.rate.toLocaleString()}</span>
                              <p className="text-xs text-muted-foreground">per gram</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Range:</span>
                          <span>₹{Math.min(...goldRates.map(r => r.rate)).toLocaleString()} - ₹{Math.max(...goldRates.map(r => r.rate)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Making Charges Summary */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center space-x-2 text-base">
                        <Settings className="h-5 w-5 text-slate-500" />
                        <span>Making Charges</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                          <div>
                            <span className="font-medium text-sm">Chains</span>
                            <p className="text-xs text-muted-foreground">Basic chain work</p>
                          </div>
                          <span className="font-semibold text-sm">{makingCharges.chains}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                          <div>
                            <span className="font-medium text-sm">Plain</span>
                            <p className="text-xs text-muted-foreground">Simple designs</p>
                          </div>
                          <span className="font-semibold text-sm">{makingCharges.plain}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                          <div>
                            <span className="font-medium text-sm">Temple</span>
                            <p className="text-xs text-muted-foreground">Traditional work</p>
                          </div>
                          <span className="font-semibold text-sm">{makingCharges.temple}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 border rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                          <div>
                            <span className="font-medium text-sm">Italian Gold</span>
                            <p className="text-xs text-muted-foreground">Premium craft</p>
                          </div>
                          <span className="font-semibold text-sm">{makingCharges.italianGold}%</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Range:</span>
                          <span>{Math.min(makingCharges.chains, makingCharges.plain, makingCharges.temple, makingCharges.italianGold)}% - {Math.max(makingCharges.chains, makingCharges.plain, makingCharges.temple, makingCharges.italianGold)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Diamond Rates Preview */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center space-x-2 text-base">
                        <Diamond className="h-5 w-5 text-blue-500" />
                        <span>Diamond Rates</span>
                      </h4>
                      <div className="space-y-3">
                        {diamondRates.slice(0, 4).map((rate, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                            <div>
                              <span className="font-medium text-sm">{rate.color}-{rate.clarity}</span>
                              <p className="text-xs text-muted-foreground">{rate.certification}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-sm">₹{(rate.rate / 1000).toFixed(0)}K</span>
                              <p className="text-xs text-muted-foreground">per carat</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Total rates:</span>
                          <span>{diamondRates.length} combinations</span>
                        </div>
                        {diamondRates.length > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Price range:</span>
                            <span>₹{(Math.min(...diamondRates.map(r => r.rate)) / 1000).toFixed(0)}K - ₹{(Math.max(...diamondRates.map(r => r.rate)) / 1000).toFixed(0)}K</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}