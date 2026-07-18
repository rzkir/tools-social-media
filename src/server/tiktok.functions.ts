import { createServerFn } from "@tanstack/react-start";
import {
	getSelfUser,
	listAllReposts,
	listReposts,
	removeRepost,
	TikTokServiceError,
} from "#/services/tiktok.services";

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

export const listRepostsFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			cookies: string;
			secUid: string;
			cursor?: string;
			count?: number;
		}) => data,
	)
	.handler(async ({ data }) => {
		try {
			const page = await listReposts(
				data.cookies,
				data.secUid,
				data.cursor ?? "0",
				data.count ?? 30,
			);
			return { ok: true as const, page };
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});

export const listAllRepostsFn = createServerFn({ method: "POST" })
	.validator(
		(data: {
			cookies: string;
			secUid: string;
			uniqueId?: string;
			maxPages?: number;
		}) => data,
	)
	.handler(async ({ data }) => {
		try {
			const result = await listAllReposts(data.cookies, data.secUid, {
				maxPages: data.maxPages ?? 40,
				uniqueId: data.uniqueId,
			});
			return {
				ok: true as const,
				items: result.items,
				refreshed: result.refreshed,
			};
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});

export const removeRepostFn = createServerFn({ method: "POST" })
	.validator((data: { cookies: string; itemId: string }) => data)
	.handler(async ({ data }) => {
		try {
			await removeRepost(data.cookies, data.itemId);
			return { ok: true as const };
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});
