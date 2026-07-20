import { createServerFn } from "@tanstack/react-start";
import {
	getSelfUser,
	InstagramServiceError,
} from "#/services/instagram.services";

function toErrorMessage(err: unknown): string {
	if (err instanceof InstagramServiceError) return err.message;
	if (err instanceof Error) return err.message;
	return "Terjadi kesalahan tidak dikenal.";
}

export const verifyInstagramSessionFn = createServerFn({ method: "POST" })
	.validator(
		(data: { cookies: string; username?: string; avatarHint?: string }) => data,
	)
	.handler(async ({ data }) => {
		try {
			let user = await getSelfUser(data.cookies, data.username);
			const hint = data.avatarHint?.trim();
			if (!user.avatarUrl && hint) {
				user = { ...user, avatarUrl: hint };
			}
			return { ok: true as const, user };
		} catch (err) {
			return { ok: false as const, error: toErrorMessage(err) };
		}
	});
