import { CalendarDashboard } from "@/components/CalendarDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary scope="page">
      <CalendarDashboard />
    </ErrorBoundary>
  );
}
