import { createServerFn } from "@tanstack/react-start";
import { getSelfUser, TikTokServiceError } from "#/services/tiktok.services";

function toErrorMessage(err: unknown): string {
	if (err instanceof TikTokServiceError) return err.message;
	if (err instanceof Error) return err.message;
	return "Terjadi kesalahan tidak dikenal.";
}

export const verifySessionFn = createServerFn({ method: "POST" })
	.validator(
		(data: { cookies: string; uniqueId?: string; secUid?: string }) => data,
	)
	.handler(async ({ data }) => {
		try {
			const user = await getSelfUser(data.cookies, data.uniqueId, data.secUid);
			return { ok: true as const, user };
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});
