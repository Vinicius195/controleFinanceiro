'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  dineInRevenue: number;
  deliveryRevenue: number;
  takeoutRevenue: number;
  ingredientCosts: number;
  wageCosts: number;
  rentCosts: number;
  otherCosts: number;
}

interface FinancialContextType {
  entries: DailyEntry[];
  addOrUpdateEntry: (entry: DailyEntry) => void;
  getEntryByDate: (date: string) => DailyEntry | undefined;
  getAggregatedData: () => {
    dineInRevenue: number;
    deliveryRevenue: number;
    takeoutRevenue: number;
    ingredientCosts: number;
    wageCosts: number;
    rentCosts: number;
    otherCosts: number;
    totalRevenue: number;
    totalExpenses: number;
  };
}

const FinancialDataContext = createContext<FinancialContextType | undefined>(undefined);

const STORAGE_KEY = 'financialData';

export const FinancialDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setEntries(JSON.parse(storedData));
      } else {
        // Add some mock data for the first time
        const mockEntry: DailyEntry = {
            date: format(new Date(), 'yyyy-MM-dd'),
            dineInRevenue: 20000,
            deliveryRevenue: 15000,
            takeoutRevenue: 10000,
            ingredientCosts: 12000,
            wageCosts: 10000,
            rentCosts: 6000,
            otherCosts: 2000,
        };
        setEntries([mockEntry]);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [entries]);

  const addOrUpdateEntry = (newEntry: DailyEntry) => {
    setEntries(prevEntries => {
      const existingIndex = prevEntries.findIndex(e => e.date === newEntry.date);
      if (existingIndex > -1) {
        const updatedEntries = [...prevEntries];
        updatedEntries[existingIndex] = newEntry;
        return updatedEntries;
      } else {
        return [...prevEntries, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
    });
  };

  const getEntryByDate = (date: string): DailyEntry | undefined => {
    return entries.find(e => e.date === date);
  };
    
  const getAggregatedData = () => {
    return entries.reduce(
        (acc, entry) => {
        acc.dineInRevenue += entry.dineInRevenue;
        acc.deliveryRevenue += entry.deliveryRevenue;
        acc.takeoutRevenue += entry.takeoutRevenue;
        acc.ingredientCosts += entry.ingredientCosts;
        acc.wageCosts += entry.wageCosts;
        acc.rentCosts += entry.rentCosts;
        acc.otherCosts += entry.otherCosts;
        acc.totalRevenue += entry.dineInRevenue + entry.deliveryRevenue + entry.takeoutRevenue;
        acc.totalExpenses += entry.ingredientCosts + entry.wageCosts + entry.rentCosts + entry.otherCosts;
        return acc;
        },
        {
        dineInRevenue: 0,
        deliveryRevenue: 0,
        takeoutRevenue: 0,
        ingredientCosts: 0,
        wageCosts: 0,
        rentCosts: 0,
        otherCosts: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        }
    );
  };

  return (
    <FinancialDataContext.Provider value={{ entries, addOrUpdateEntry, getEntryByDate, getAggregatedData }}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = (): FinancialContextType => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};
