import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ChartValuesType } from './PageContext';

type ReportItem = {
  i: number,
  id: string,
  type: "TextEditor" | "Chart",
  value: string | ChartValuesType
}
type ReportDataContextType = {
  reportData: ReportItem[],
  setReportData: React.Dispatch<React.SetStateAction<ReportItem[]>>
};

const ReportDataContext = createContext<ReportDataContextType|undefined>(undefined);

type ReportDataProviderProps = { children: ReactNode };

export const ReportDataProvider: React.FC<ReportDataProviderProps> = ({ children }) => {
  const [reportData, setReportData] = useState<ReportItem[]>([]);

  return (
    <ReportDataContext.Provider value={{ reportData, setReportData }}>
      {children}
    </ReportDataContext.Provider>
  );
};

export const useReportData = () => {
  const context = useContext(ReportDataContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
