import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import LoadingScreen from "#/components/LoadingScreen";
import { ProgressHost } from "#/components/ProgressHost";
import { DashboardHeader } from "#/components/ui/header";
import { Sidebar } from "#/components/ui/sidebar";
import { MinimizeProvider } from "#/context/MinimizeContext";
import { NotificationProvider } from "#/context/NotificationContext";
import { useMetricsCacheSync } from "#/hooks/use-metrics";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
});

function DashboardLayout() {
	useMetricsCacheSync();
	// Placeholder until login/auth gate — swap for session check later.
	const [ready, setReady] = useState(false);

	return (
		<NotificationProvider>
			<MinimizeProvider>
				{!ready ? (
					<LoadingScreen
						brand="Social Tools"
						captainStatus="Menyiapkan dashboard..."
						onComplete={() => setReady(true)}
						className="fixed inset-0 z-[200]"
					/>
				) : null}

				<div
					className="dashboard-shell flex min-h-screen bg-[#F8FAFC] text-slate-800"
					aria-hidden={!ready}
				>
					<Sidebar />
					<main className="main-content-area ml-64 flex-1 p-8">
						<DashboardHeader />
						<Outlet />
					</main>
				</div>

				{/* Always mounted so progress overlay survives loading / remounts */}
				<ProgressHost />
			</MinimizeProvider>
		</NotificationProvider>
	);
}
