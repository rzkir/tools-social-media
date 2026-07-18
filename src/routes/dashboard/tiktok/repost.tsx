import { createFileRoute } from "@tanstack/react-router";
import { TikTokRemoveTool } from "#/components/TikTokRemoveTool";

export const Route = createFileRoute("/dashboard/tiktok/repost")({
	component: TikTokRepostPage,
});

function TikTokRepostPage() {
	return <TikTokRemoveTool mode="repost" />;
}
