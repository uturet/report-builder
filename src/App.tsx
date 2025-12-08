import { PageProvider, usePage } from "./components/PageContext";
import ReportPage from "./pages/ReportPage";
import ChartBuilderPage from "./pages/ChartBuilderPage";
import SqlDemo from "./components/SQLDemo";

function View() {
  const { page } = usePage();

  return <SqlDemo />

  if (page.name === "report") return <ReportPage />;
  if (page.name === "chart-builder") return <ChartBuilderPage />;

  return null;
}

export default function App() {
  return (
    <PageProvider>
      <View />
    </PageProvider>
  );
}
