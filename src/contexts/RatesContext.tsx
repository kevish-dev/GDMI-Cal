import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  getGoldRates, 
  getDiamondRates, 
  getMakingCharges, 
  createGoldRates, 
  createDiamondRates, 
  createMakingCharges,
  subscribeToGoldRates,
  subscribeToDiamondRates,
  subscribeToMakingCharges,
  initializeDummyRates,
  getSystemAnalytics,
  subscribeToSystemAnalytics,
  getRecentActivities,
  subscribeToRecentActivities,
  saveCalculationToFirebase,
  logActivity,
  initializeSystemData,
  resetMakingChargesToDefaults,
  getGoldPremiumConfig,
  updateGoldPremiumConfig,
  subscribeToGoldPremiumConfig
} from '@/services/firestore.js';

export interface GoldRate {
  carat: string;
  rate: number;
  lastRate?: number; // Previous rate for comparison
  lastUpdated: string;
}

export interface DiamondRate {
  color: string;
  clarity: string;
  certification: string;
  rate: number;
}

export interface MakingCharges {
  chains: number;
  plain: number;
  temple: number;
  italianGold: number;
  diamond: number; // Per gram for diamond jewelry
}

interface CalculationRecord {
  id: string;
  type: 'gold' | 'diamond';
  timestamp: string;
  totalValue: number;
  goldWeight?: number;
  diamondWeight?: number;
  carat?: string;
  JewelleryType?: string;
  jewellerQuote?: number;
  priceDifference?: number;
  diamondColor?: string; // Optional diamond color
  diamondClarity?: string; // Optional diamond clarity
  certification?: string; // Diamond certification
}

interface SystemAnalytics {
  totalCalculations: number;
  goldCalculations: number;
  diamondCalculations: number;
  totalValue: number;
  avgValue: number;
  lastUpdated?: any;
}

interface ActivityLog {
  id: string;
  type: 'system' | 'rates' | 'calculation';
  action: string;
  description: string;
  icon?: string;
  timestamp: any;
}

export interface GoldPremiumConfig {
  premium: number; // Premium per gram to add to base price
  basePrice: number; // Last fetched base price from API (per gram)
  lastApiPrice: number; // Raw price from API (for 10g)
  lastUpdated?: any;
  autoUpdateEnabled: boolean;
  expiry?: string | null;
}

interface RatesContextType {
  goldRates: GoldRate[];
  diamondRates: DiamondRate[];
  makingCharges: MakingCharges;
  calculations: CalculationRecord[];
  systemAnalytics: SystemAnalytics;
  recentActivities: ActivityLog[];
  goldPremiumConfig: GoldPremiumConfig;
  loading: boolean;
  updateGoldRates: (rates: GoldRate[]) => Promise<void>;
  updateDiamondRates: (rates: DiamondRate[]) => Promise<void>;
  updateMakingCharges: (charges: MakingCharges) => Promise<void>;
  resetMakingCharges: () => Promise<void>;
  addCalculation: (calculation: Omit<CalculationRecord, 'id' | 'timestamp'>) => Promise<void>;
  getAnalytics: () => SystemAnalytics;
  updateGoldPremium: (config: Partial<GoldPremiumConfig>) => Promise<void>;
  fetchAndUpdateGoldPrice: () => Promise<{ success: boolean; error?: string }>;
}

const RatesContext = createContext<RatesContextType | undefined>(undefined);

export function RatesProvider({ children }: { children: ReactNode }) {
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [diamondRates, setDiamondRates] = useState<DiamondRate[]>([]);
  const [makingCharges, setMakingCharges] = useState<MakingCharges>({
    chains: 2.5,
    plain: 3.5,
    temple: 7,
    italianGold: 18,
    diamond: 800 // Default per gram for diamond jewelry
  });
  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics>({
    totalCalculations: 0,
    goldCalculations: 0,
    diamondCalculations: 0,
    totalValue: 0,
    avgValue: 0
  });
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [goldPremiumConfig, setGoldPremiumConfig] = useState<GoldPremiumConfig>({
    premium: 0,
    basePrice: 0,
    lastApiPrice: 0,
    autoUpdateEnabled: false,
    expiry: null
  });
  const [loading, setLoading] = useState(true);

  // Define fetchAndUpdateGoldPrice using useCallback so it can be used in useEffect
  const fetchAndUpdateGoldPrice = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Dynamically import the gold price service
      const { fetchLiveGoldPrice, calculateCaratPrices } = await import('@/services/goldPriceService');
      
      // Fetch live price from API
      const priceResult = await fetchLiveGoldPrice();
      
      if (!priceResult.success || !priceResult.basePrice) {
        return {
          success: false,
          error: priceResult.error || 'Failed to fetch gold price'
        };
      }

      // Update the premium config with new base price
      const updatedConfig: Partial<GoldPremiumConfig> = {
        basePrice: priceResult.basePrice,
        lastApiPrice: priceResult.rawPrice || 0,
        expiry: priceResult.expiry,
        premium: goldPremiumConfig.premium // Keep existing premium
      };
      
      await updateGoldPremiumConfig({ ...goldPremiumConfig, ...updatedConfig });

      // Calculate final 24K price (base + premium)
      const final24KPrice = priceResult.basePrice + goldPremiumConfig.premium;
      
      // Calculate prices for all carat types
      const caratPrices = calculateCaratPrices(final24KPrice);

      // Update gold rates with new prices
      const updatedRates: GoldRate[] = Object.entries(caratPrices).map(([carat, rate]) => {
        const existingRate = goldRates.find(r => r.carat === carat);
        return {
          carat,
          rate,
          lastRate: existingRate?.rate || rate,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      });

      await createGoldRates(updatedRates);

      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Gold prices updated from API',
        description: `Base: ₹${priceResult.basePrice}/g, Premium: ₹${goldPremiumConfig.premium}/g, Final 24K: ₹${final24KPrice}/g`,
        icon: 'TrendingUp'
      });

      return { success: true };
    } catch (error) {
      console.error('Error fetching and updating gold price:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }, [goldPremiumConfig, goldRates]);

  // Auto-update gold rates every 15 minutes
  useEffect(() => {
    let autoUpdateInterval: NodeJS.Timeout | null = null;

    const setupAutoUpdate = () => {
      // Clear existing interval if any
      if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
      }

      // Only set up auto-update if enabled
      if (goldPremiumConfig.autoUpdateEnabled) {
        console.log('🔄 Auto-update enabled: Fetching gold rates every 15 minutes');
        
        // Set up interval to fetch and update every 15 minutes (900000 ms)
        autoUpdateInterval = setInterval(async () => {
          console.log('⏰ Auto-updating gold rates from API...');
          try {
            const result = await fetchAndUpdateGoldPrice();
            if (result.success) {
              console.log('✅ Auto-update successful');
            } else {
              console.error('❌ Auto-update failed:', result.error);
            }
          } catch (error) {
            console.error('❌ Auto-update error:', error);
          }
        }, 15 * 60 * 1000); // 15 minutes in milliseconds
      } else {
        console.log('⏸️ Auto-update disabled');
      }
    };

    // Setup auto-update when config changes
    setupAutoUpdate();

    // Cleanup on unmount
    return () => {
      if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
      }
    };
  }, [goldPremiumConfig.autoUpdateEnabled]); // Re-run when auto-update is toggled

  // Initialize rates and system data from Firebase
  useEffect(() => {
    let goldUnsubscribe: (() => void) | null = null;
    let diamondUnsubscribe: (() => void) | null = null;
    let makingChargesUnsubscribe: (() => void) | null = null;
    let analyticsUnsubscribe: (() => void) | null = null;
    let activitiesUnsubscribe: (() => void) | null = null;
    let premiumConfigUnsubscribe: (() => void) | null = null;

    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize dummy rates if they don't exist
        const initializedRates = await initializeDummyRates();
        
        // Initialize system data (analytics and activities)
        const systemData = await initializeSystemData();
        
        // Initialize gold premium config
        const premiumConfig = await getGoldPremiumConfig();
        
        // Set initial data
        setGoldRates(initializedRates.goldRates);
        setDiamondRates(initializedRates.diamondRates);
        setMakingCharges(initializedRates.makingCharges);
        setSystemAnalytics(systemData.analytics);
        setRecentActivities(systemData.activities);
        setGoldPremiumConfig(premiumConfig);

        // Set up real-time listeners
        goldUnsubscribe = subscribeToGoldRates((rates) => {
          setGoldRates(rates);
        });

        diamondUnsubscribe = subscribeToDiamondRates((rates) => {
          setDiamondRates(rates);
        });

        makingChargesUnsubscribe = subscribeToMakingCharges((charges) => {
          if (charges) {
            setMakingCharges(charges);
          }
        });

        analyticsUnsubscribe = subscribeToSystemAnalytics((analytics) => {
          setSystemAnalytics(analytics);
        });

        activitiesUnsubscribe = subscribeToRecentActivities((activities) => {
          setRecentActivities(activities);
        }, 10);

        premiumConfigUnsubscribe = subscribeToGoldPremiumConfig((config) => {
          setGoldPremiumConfig(config);
        });

      } catch (error) {
        console.error('Error initializing rates:', error);
        
        // Fallback to local dummy data
        const fallbackGoldRates = [
          { carat: "24K", rate: 7000, lastRate: 6950, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "22K", rate: 6510, lastRate: 6460, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "18K", rate: 5320, lastRate: 5280, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "14K", rate: 4200, lastRate: 4160, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "9K", rate: 2730, lastRate: 2700, lastUpdated: new Date().toISOString().split('T')[0] }
        ];
        
        const fallbackDiamondRates = [
          { color: "GH", clarity: "VVS1", certification: "IGI", rate: 51332 },
          { color: "GH", clarity: "VVS1", certification: "Self", rate: 32333 },
          { color: "GH", clarity: "VVS2", certification: "IGI", rate: 51999 },
          { color: "GH", clarity: "VVS2", certification: "Self", rate: 33000 },
          { color: "HI", clarity: "VVS1", certification: "IGI", rate: 47332 },
          { color: "HI", clarity: "VVS1", certification: "Self", rate: 28499 },
          { color: "IJ", clarity: "VS1", certification: "IGI", rate: 42000 },
          { color: "IJ", clarity: "VS1", certification: "Self", rate: 24000 },
          { color: "JK", clarity: "SI1", certification: "IGI", rate: 36666 },
          { color: "JK", clarity: "SI1", certification: "Self", rate: 20500 },
          { color: "KL", clarity: "I1/I2/I3", certification: "IGI", rate: 32000 },
          { color: "KL", clarity: "I1/I2/I3", certification: "Self", rate: 17000 }
        ];
        
        setGoldRates(fallbackGoldRates);
        setDiamondRates(fallbackDiamondRates);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Load calculations from localStorage (keeping this local for now)
    const savedCalculations = localStorage.getItem('Jewellery_calculations');
    if (savedCalculations) {
      setCalculations(JSON.parse(savedCalculations));
    }

    // Cleanup listeners on unmount
    return () => {
      if (goldUnsubscribe) goldUnsubscribe();
      if (diamondUnsubscribe) diamondUnsubscribe();
      if (makingChargesUnsubscribe) makingChargesUnsubscribe();
      if (analyticsUnsubscribe) analyticsUnsubscribe();
      if (activitiesUnsubscribe) activitiesUnsubscribe();
      if (premiumConfigUnsubscribe) premiumConfigUnsubscribe();
    };
  }, []);

  const updateGoldRates = async (rates: GoldRate[]) => {
    try {
      await createGoldRates(rates);
      
      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Gold rates updated',
        description: `Updated rates for ${rates.length} gold types`,
        icon: 'Crown'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating gold rates:', error);
      throw error;
    }
  };

  const updateDiamondRates = async (rates: DiamondRate[]) => {
    try {
      await createDiamondRates(rates);
      
      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Diamond rates updated',
        description: `Processed ${rates.length} diamond rate entries`,
        icon: 'Diamond'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating diamond rates:', error);
      throw error;
    }
  };

  const updateMakingCharges = async (charges: MakingCharges) => {
    try {
      await createMakingCharges(charges);
      
      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Making charges updated',
        description: 'Updated making charges for all Jewellery types',
        icon: 'Settings'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating making charges:', error);
      throw error;
    }
  };

  const resetMakingCharges = async () => {
    try {
      const defaultCharges = await resetMakingChargesToDefaults();
      
      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Making charges reset',
        description: 'Reset making charges to default values',
        icon: 'Settings'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error resetting making charges:', error);
      throw error;
    }
  };

  const addCalculation = async (calculation: Omit<CalculationRecord, 'id' | 'timestamp'>) => {
    try {
      // Save to Firebase and update analytics automatically
      await saveCalculationToFirebase(calculation);
      
      // Also save to local state for immediate feedback
      const newCalculation: CalculationRecord = {
        ...calculation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      const updatedCalculations = [...calculations, newCalculation];
      setCalculations(updatedCalculations);
      localStorage.setItem('Jewellery_calculations', JSON.stringify(updatedCalculations));
    } catch (error) {
      console.error('Error adding calculation:', error);
      // Fallback to local storage only
      const newCalculation: CalculationRecord = {
        ...calculation,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      const updatedCalculations = [...calculations, newCalculation];
      setCalculations(updatedCalculations);
      localStorage.setItem('Jewellery_calculations', JSON.stringify(updatedCalculations));
    }
  };

  const getAnalytics = (): SystemAnalytics => {
    // Return real-time Firebase analytics instead of local calculations
    return systemAnalytics;
  };

  const updateGoldPremium = async (config: Partial<GoldPremiumConfig>) => {
    try {
      const updatedConfig = { ...goldPremiumConfig, ...config };
      await updateGoldPremiumConfig(updatedConfig);
      
      // Log activity
      await logActivity({
        type: 'rates',
        action: 'Gold premium updated',
        description: `Premium set to ₹${config.premium}/g, Base price: ₹${config.basePrice}/g`,
        icon: 'Crown'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating gold premium:', error);
      throw error;
    }
  };

  return (
    <RatesContext.Provider value={{
      goldRates,
      diamondRates,
      makingCharges,
      calculations,
      systemAnalytics,
      recentActivities,
      goldPremiumConfig,
      loading,
      updateGoldRates,
      updateDiamondRates,
      updateMakingCharges,
      resetMakingCharges,
      addCalculation,
      getAnalytics,
      updateGoldPremium,
      fetchAndUpdateGoldPrice
    }}>
      {children}
    </RatesContext.Provider>
  );
}

export function useRates() {
  const context = useContext(RatesContext);
  if (context === undefined) {
    throw new Error('useRates must be used within a RatesProvider');
  }
  return context;
}