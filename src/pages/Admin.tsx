import { useState } from "react";
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
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRates, type GoldRate, type DiamondRate } from "@/contexts/RatesContext";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [newGoldRate24K, setNewGoldRate24K] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { goldRates, updateGoldRates, diamondRates, updateDiamondRates, getAnalytics } = useRates();
  const navigate = useNavigate();

  const analytics = getAnalytics();

  // Conversion factors for different carat gold
  const conversionFactors = {
    "24K": 1.00,
    "22K": 0.93,
    "18K": 0.76,
    "14K": 0.60,
    "9K": 0.39
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate rates for all carats based on 24K price
      const updatedRates: GoldRate[] = Object.entries(conversionFactors).map(([carat, factor]) => ({
        carat,
        rate: Math.round(rate24K * factor),
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      
      updateGoldRates(updatedRates);
      setNewGoldRate24K("");
      
      toast({
        title: "Gold rates updated",
        description: `All gold rates updated based on 24K price of ₹${rate24K}/g`
      });
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock processing - in real app, parse CSV and update diamond rates
      const mockDiamondRates: DiamondRate[] = [
        { color: "GH", clarity: "VVS1", certification: "IGI", rate: 45000 },
        { color: "GH", clarity: "VVS2", certification: "IGI", rate: 42000 },
        { color: "HI", clarity: "VS1", certification: "IGI", rate: 38000 },
        { color: "IJ", clarity: "SI1", certification: "Self", rate: 25000 }
      ];
      
      updateDiamondRates([...diamondRates, ...mockDiamondRates]);
      
      toast({
        title: "CSV uploaded successfully",
        description: `Processed ${file.name} with diamond rates.`
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process CSV file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // Remove the mock statistics section since we're now using real data from context

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage jewelry rates and monitor system performance
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Settings className="h-4 w-4 mr-2" />
                {user?.username} - Administrator
              </Badge>
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Calculations</p>
                    <p className="text-2xl font-bold">{analytics.totalCalculations.toLocaleString()}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4">
                  <Progress value={analytics.totalCalculations > 0 ? 75 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Real-time data</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{analytics.todayCalculations}</p>
                  </div>
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <div className="mt-4">
                  <Progress value={analytics.todayCalculations > 0 ? 60 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Today's activity</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Calculation Value</p>
                    <p className="text-2xl font-bold">₹{(analytics.avgValue / 1000).toFixed(0)}K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-accent" />
                </div>
                <div className="mt-4">
                  <Progress value={analytics.avgValue > 0 ? 85 : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Average calculation</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">₹{(analytics.totalValue / 100000).toFixed(1)}L</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-4">
                  <Progress value={analytics.totalValue > 0 ? Math.min((analytics.totalValue / 1000000) * 100, 100) : 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">Total portfolio value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="rates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rates" className="flex items-center space-x-2">
                <Crown className="h-4 w-4" />
                <span>Gold Rates</span>
              </TabsTrigger>
              <TabsTrigger value="diamonds" className="flex items-center space-x-2">
                <Diamond className="h-4 w-4" />
                <span>Diamond Rates</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Gold Rates Tab */}
            <TabsContent value="rates" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Current Rates */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span>Current Gold Rates</span>
                    </CardTitle>
                    <CardDescription>
                      Real-time gold rates per gram by carat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {goldRates.map((rate, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                          <div>
                            <p className="font-semibold">{rate.carat} Gold</p>
                            <p className="text-sm text-muted-foreground">
                              Updated: {rate.lastUpdated}
                            </p>
                          </div>
                          <Badge className="text-lg px-3 py-1 gradient-gold">
                            ₹{rate.rate.toLocaleString()}/g
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Update Rates */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>Update Gold Rates</span>
                    </CardTitle>
                    <CardDescription>
                      Enter 24K gold rate - all other carat rates will be calculated automatically
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rate24k">24K Gold Rate per gram (₹)</Label>
                      <Input
                        id="rate24k"
                        type="number"
                        placeholder="Enter 24K gold rate"
                        value={newGoldRate24K}
                        onChange={(e) => setNewGoldRate24K(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Other rates will be calculated automatically:
                        <br />22K = 93% | 18K = 76% | 14K = 60% | 9K = 39%
                      </p>
                    </div>

                    <Button
                      onClick={handleGoldRateUpdate}
                      disabled={isUploading}
                      className="w-full gradient-gold hover-glow"
                    >
                      {isUploading ? "Updating..." : "Update All Gold Rates"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Diamond Rates Tab */}
            <TabsContent value="diamonds" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-secondary" />
                    <span>Diamond Rate Management</span>
                  </CardTitle>
                  <CardDescription>
                    Upload CSV files with diamond rates based on color, clarity, and certification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Diamond className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Diamond Rates CSV</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload a CSV file with columns: Color, Clarity, Certification, Rate
                    </p>
                    <div className="flex items-center justify-center">
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
                        className="gradient-diamond hover-glow"
                      >
                        {isUploading ? "Processing..." : "Choose CSV File"}
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Color: KL, JK, IJ, HI, GH</li>
                      <li>Clarity: I1-I3, SI1, SI2, VS1, VS2, VVS1, VVS2</li>
                      <li>Certification: IGI, Self, None</li>
                      <li>Rate: Price per carat in ₹</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Calculation Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of jewelry calculations by type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span>Gold Jewelry</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{analytics.goldCalculations}</p>
                          <p className="text-sm text-muted-foreground">
                            {analytics.totalCalculations > 0 ? ((analytics.goldCalculations / analytics.totalCalculations) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                      <Progress value={analytics.totalCalculations > 0 ? (analytics.goldCalculations / analytics.totalCalculations) * 100 : 0} />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Diamond className="h-4 w-4 text-secondary" />
                          <span>Diamond Jewelry</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{analytics.diamondCalculations}</p>
                          <p className="text-sm text-muted-foreground">
                            {analytics.totalCalculations > 0 ? ((analytics.diamondCalculations / analytics.totalCalculations) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                      <Progress value={analytics.totalCalculations > 0 ? (analytics.diamondCalculations / analytics.totalCalculations) * 100 : 0} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest system activities and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium">Gold rates updated</p>
                          <p className="text-xs text-muted-foreground">22K, 18K rates updated - 2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Upload className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium">Diamond CSV uploaded</p>
                          <p className="text-xs text-muted-foreground">145 diamond rates processed - 1 day ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Users className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm font-medium">New user registrations</p>
                          <p className="text-xs text-muted-foreground">12 new users joined - 2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}