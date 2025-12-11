import { createContext, useContext, useState, type ReactNode } from "react";
import type { ScatterValue } from "./ChartView";
import type { Select } from "../util";

export type ChartValuesType = { 
  value: ScatterValue[], 
  userSQL: string, 
  userSelect: Select 
}
export type ChartBuilderPageProps = {
  chartValues: ChartValuesType,
  setChartValues: (cv: ChartValuesType) => void
}

export type Page = {
  name: "report" | "chart-builder",
  id: string,
  props?: ChartBuilderPageProps
};

interface PageContextValue {
  page: Page;
  setPage: (p: Page) => void;
}

const PageContext = createContext<PageContextValue | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({ name: "report", id: 'default' });

  return (
    <PageContext.Provider value={{ page, setPage }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePage(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) {
    throw new Error("usePage must be used within a PageProvider");
  }
  return ctx;
}
