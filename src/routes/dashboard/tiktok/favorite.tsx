import { createFileRoute } from "@tanstack/react-router";
import { TikTokRemoveTool } from "#/components/TikTokRemoveTool";

export const Route = createFileRoute("/dashboard/tiktok/favorite")({
	component: TikTokFavoritePage,
});

function TikTokFavoritePage() {
	return <TikTokRemoveTool mode="favorite" />;
}
