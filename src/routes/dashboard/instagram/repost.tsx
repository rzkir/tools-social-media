import { createFileRoute } from "@tanstack/react-router";
import { InstagramRemoveTool } from "#/components/InstagramRemoveTool";

export const Route = createFileRoute("/dashboard/instagram/repost")({
	component: InstagramRepostPage,
});

function InstagramRepostPage() {
	return <InstagramRemoveTool />;
}
