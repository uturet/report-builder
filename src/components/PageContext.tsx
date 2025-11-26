import { createContext, useContext, useState, type ReactNode } from "react";

export type Page = {
  name: "report" | "chart-builder",
  id: string
};

interface PageContextValue {
  page: Page;
  setPage: (p: Page) => void;
}

const PageContext = createContext<PageContextValue | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({name: "report", id: 'default'});

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
