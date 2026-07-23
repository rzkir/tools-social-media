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

	if (!ready) {
		return (
			<LoadingScreen
				brand="Social Tools"
				captainStatus="Menyiapkan dashboard..."
				onComplete={() => setReady(true)}
			/>
		);
	}

	return (
		<NotificationProvider>
			<MinimizeProvider>
				<div className="dashboard-shell flex min-h-screen bg-[#F8FAFC] text-slate-800">
					<Sidebar />
					<main className="main-content-area ml-64 flex-1 p-8">
						<DashboardHeader />
						<Outlet />
					</main>
				</div>
				<ProgressHost />
			</MinimizeProvider>
		</NotificationProvider>
	);
}
