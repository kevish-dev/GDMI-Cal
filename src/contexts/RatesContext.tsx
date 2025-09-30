import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  initializeSystemData
} from '@/services/firestore.js';

export interface GoldRate {
  carat: string;
  rate: number;
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
}

interface CalculationRecord {
  id: string;
  type: 'gold' | 'diamond';
  timestamp: string;
  totalValue: number;
  goldWeight?: number;
  diamondWeight?: number;
  carat?: string;
  jewelryType?: string;
  jewellerQuote?: number;
  priceDifference?: number;
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

interface RatesContextType {
  goldRates: GoldRate[];
  diamondRates: DiamondRate[];
  makingCharges: MakingCharges;
  calculations: CalculationRecord[];
  systemAnalytics: SystemAnalytics;
  recentActivities: ActivityLog[];
  loading: boolean;
  updateGoldRates: (rates: GoldRate[]) => Promise<void>;
  updateDiamondRates: (rates: DiamondRate[]) => Promise<void>;
  updateMakingCharges: (charges: MakingCharges) => Promise<void>;
  addCalculation: (calculation: Omit<CalculationRecord, 'id' | 'timestamp'>) => Promise<void>;
  getAnalytics: () => SystemAnalytics;
}

const RatesContext = createContext<RatesContextType | undefined>(undefined);

export function RatesProvider({ children }: { children: ReactNode }) {
  const [goldRates, setGoldRates] = useState<GoldRate[]>([]);
  const [diamondRates, setDiamondRates] = useState<DiamondRate[]>([]);
  const [makingCharges, setMakingCharges] = useState<MakingCharges>({
    chains: 2.5,
    plain: 3.5,
    temple: 7,
    italianGold: 18
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
  const [loading, setLoading] = useState(true);

  // Initialize rates and system data from Firebase
  useEffect(() => {
    let goldUnsubscribe: (() => void) | null = null;
    let diamondUnsubscribe: (() => void) | null = null;
    let makingChargesUnsubscribe: (() => void) | null = null;
    let analyticsUnsubscribe: (() => void) | null = null;
    let activitiesUnsubscribe: (() => void) | null = null;

    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize dummy rates if they don't exist
        const initializedRates = await initializeDummyRates();
        
        // Initialize system data (analytics and activities)
        const systemData = await initializeSystemData();
        
        // Set initial data
        setGoldRates(initializedRates.goldRates);
        setDiamondRates(initializedRates.diamondRates);
        setMakingCharges(initializedRates.makingCharges);
        setSystemAnalytics(systemData.analytics);
        setRecentActivities(systemData.activities);

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

      } catch (error) {
        console.error('Error initializing rates:', error);
        
        // Fallback to local dummy data
        const fallbackGoldRates = [
          { carat: "24K", rate: 7000, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "22K", rate: 6510, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "18K", rate: 5320, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "14K", rate: 4200, lastUpdated: new Date().toISOString().split('T')[0] },
          { carat: "9K", rate: 2730, lastUpdated: new Date().toISOString().split('T')[0] }
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
    const savedCalculations = localStorage.getItem('jewelry_calculations');
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
        description: 'Updated making charges for all jewelry types',
        icon: 'Settings'
      });
      
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating making charges:', error);
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
      localStorage.setItem('jewelry_calculations', JSON.stringify(updatedCalculations));
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
      localStorage.setItem('jewelry_calculations', JSON.stringify(updatedCalculations));
    }
  };

  const getAnalytics = (): SystemAnalytics => {
    // Return real-time Firebase analytics instead of local calculations
    return systemAnalytics;
  };

  return (
    <RatesContext.Provider value={{
      goldRates,
      diamondRates,
      makingCharges,
      calculations,
      systemAnalytics,
      recentActivities,
      loading,
      updateGoldRates,
      updateDiamondRates,
      updateMakingCharges,
      addCalculation,
      getAnalytics
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