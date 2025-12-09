import { PageProvider, usePage } from "./components/PageContext";
import ReportPage from "./pages/ReportPage";
import ChartBuilderPage from "./pages/ChartBuilderPage";

function View() {
  const { page } = usePage();

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
