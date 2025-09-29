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
  initializeDummyRates 
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
}

interface RatesContextType {
  goldRates: GoldRate[];
  diamondRates: DiamondRate[];
  makingCharges: MakingCharges;
  calculations: CalculationRecord[];
  loading: boolean;
  updateGoldRates: (rates: GoldRate[]) => Promise<void>;
  updateDiamondRates: (rates: DiamondRate[]) => Promise<void>;
  updateMakingCharges: (charges: MakingCharges) => Promise<void>;
  addCalculation: (calculation: Omit<CalculationRecord, 'id' | 'timestamp'>) => void;
  getAnalytics: () => {
    totalCalculations: number;
    goldCalculations: number;
    diamondCalculations: number;
    totalValue: number;
    avgValue: number;
    todayCalculations: number;
  };
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
  const [loading, setLoading] = useState(true);

  // Initialize rates from Firebase or create dummy data
  useEffect(() => {
    let goldUnsubscribe: (() => void) | null = null;
    let diamondUnsubscribe: (() => void) | null = null;
    let makingChargesUnsubscribe: (() => void) | null = null;

    const initializeRates = async () => {
      try {
        setLoading(true);
        
        // Initialize dummy rates if they don't exist
        const initializedRates = await initializeDummyRates();
        
        // Set initial data
        setGoldRates(initializedRates.goldRates);
        setDiamondRates(initializedRates.diamondRates);
        setMakingCharges(initializedRates.makingCharges);

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
          { color: "GH", clarity: "VVS1", certification: "IGI", rate: 45000 },
          { color: "GH", clarity: "VVS2", certification: "IGI", rate: 42000 },
          { color: "GH", clarity: "VS1", certification: "IGI", rate: 38000 },
          { color: "GH", clarity: "VS2", certification: "IGI", rate: 35000 },
          { color: "HI", clarity: "VVS1", certification: "IGI", rate: 40000 },
          { color: "HI", clarity: "VVS2", certification: "IGI", rate: 37000 },
          { color: "IJ", clarity: "VS1", certification: "IGI", rate: 32000 },
          { color: "JK", clarity: "SI1", certification: "Self", rate: 25000 },
          { color: "KL", clarity: "SI2", certification: "None", rate: 20000 }
        ];
        
        setGoldRates(fallbackGoldRates);
        setDiamondRates(fallbackDiamondRates);
      } finally {
        setLoading(false);
      }
    };

    initializeRates();

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
    };
  }, []);

  const updateGoldRates = async (rates: GoldRate[]) => {
    try {
      await createGoldRates(rates);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating gold rates:', error);
      throw error;
    }
  };

  const updateDiamondRates = async (rates: DiamondRate[]) => {
    try {
      await createDiamondRates(rates);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating diamond rates:', error);
      throw error;
    }
  };

  const updateMakingCharges = async (charges: MakingCharges) => {
    try {
      await createMakingCharges(charges);
      // The real-time listener will update the local state
    } catch (error) {
      console.error('Error updating making charges:', error);
      throw error;
    }
  };

  const addCalculation = (calculation: Omit<CalculationRecord, 'id' | 'timestamp'>) => {
    const newCalculation: CalculationRecord = {
      ...calculation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    const updatedCalculations = [...calculations, newCalculation];
    setCalculations(updatedCalculations);
    localStorage.setItem('jewelry_calculations', JSON.stringify(updatedCalculations));
  };

  const getAnalytics = () => {
    const totalCalculations = calculations.length;
    const goldCalculations = calculations.filter(c => c.type === 'gold').length;
    const diamondCalculations = calculations.filter(c => c.type === 'diamond').length;
    const totalValue = calculations.reduce((sum, calc) => sum + calc.totalValue, 0);
    const avgValue = totalCalculations > 0 ? totalValue / totalCalculations : 0;
    
    const today = new Date().toDateString();
    const todayCalculations = calculations.filter(c => 
      new Date(c.timestamp).toDateString() === today
    ).length;

    return {
      totalCalculations,
      goldCalculations,
      diamondCalculations,
      totalValue,
      avgValue,
      todayCalculations
    };
  };

  return (
    <RatesContext.Provider value={{
      goldRates,
      diamondRates,
      makingCharges,
      calculations,
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