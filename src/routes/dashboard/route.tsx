import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardHeader } from "#/components/ui/header";
import { Sidebar } from "#/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
	component: DashboardLayout,
});

function DashboardLayout() {
	return (
		<div className="dashboard-shell flex min-h-screen bg-[#F8FAFC] text-slate-800">
			<Sidebar />
			<main className="main-content-area ml-64 flex-1 p-8">
				<DashboardHeader />
				<Outlet />
			</main>
		</div>
	);
}
