import { createFileRoute } from "@tanstack/react-router";
import { TikTokRemoveTool } from "#/components/TikTokRemoveTool";

export const Route = createFileRoute("/dashboard/tiktok/like")({
	component: TikTokLikePage,
});

function TikTokLikePage() {
	return <TikTokRemoveTool mode="like" />;
}
