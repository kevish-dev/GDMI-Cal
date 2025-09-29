import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  updateGoldRates: (rates: GoldRate[]) => void;
  updateDiamondRates: (rates: DiamondRate[]) => void;
  updateMakingCharges: (charges: MakingCharges) => void;
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
  const [goldRates, setGoldRates] = useState<GoldRate[]>([
    { carat: "24K", rate: 7000, lastUpdated: "2024-01-15" },
    { carat: "22K", rate: 6510, lastUpdated: "2024-01-15" },
    { carat: "18K", rate: 5320, lastUpdated: "2024-01-15" },
    { carat: "14K", rate: 4200, lastUpdated: "2024-01-15" },
    { carat: "9K", rate: 2730, lastUpdated: "2024-01-15" }
  ]);

  const [diamondRates, setDiamondRates] = useState<DiamondRate[]>([
    { color: "GH", clarity: "VVS1", certification: "IGI", rate: 45000 },
    { color: "GH", clarity: "VVS2", certification: "IGI", rate: 42000 },
    { color: "GH", clarity: "VS1", certification: "IGI", rate: 38000 },
    { color: "GH", clarity: "VS2", certification: "IGI", rate: 35000 },
    { color: "HI", clarity: "VVS1", certification: "IGI", rate: 40000 },
    { color: "HI", clarity: "VVS2", certification: "IGI", rate: 37000 },
    { color: "IJ", clarity: "VS1", certification: "IGI", rate: 32000 },
    { color: "JK", clarity: "SI1", certification: "Self", rate: 25000 },
    { color: "KL", clarity: "SI2", certification: "None", rate: 20000 }
  ]);

  const [makingCharges, setMakingCharges] = useState<MakingCharges>({
    chains: 2.5,
    plain: 3.5,
    temple: 7,
    italianGold: 18
  });

  const [calculations, setCalculations] = useState<CalculationRecord[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedGoldRates = localStorage.getItem('jewelry_gold_rates');
    const savedDiamondRates = localStorage.getItem('jewelry_diamond_rates');
    const savedMakingCharges = localStorage.getItem('jewelry_making_charges');
    const savedCalculations = localStorage.getItem('jewelry_calculations');

    if (savedGoldRates) setGoldRates(JSON.parse(savedGoldRates));
    if (savedDiamondRates) setDiamondRates(JSON.parse(savedDiamondRates));
    if (savedMakingCharges) setMakingCharges(JSON.parse(savedMakingCharges));
    if (savedCalculations) setCalculations(JSON.parse(savedCalculations));
  }, []);

  const updateGoldRates = (rates: GoldRate[]) => {
    setGoldRates(rates);
    localStorage.setItem('jewelry_gold_rates', JSON.stringify(rates));
  };

  const updateDiamondRates = (rates: DiamondRate[]) => {
    setDiamondRates(rates);
    localStorage.setItem('jewelry_diamond_rates', JSON.stringify(rates));
  };

  const updateMakingCharges = (charges: MakingCharges) => {
    setMakingCharges(charges);
    localStorage.setItem('jewelry_making_charges', JSON.stringify(charges));
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