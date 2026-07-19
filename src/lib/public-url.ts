/** App public origin from `PUBLIC_URL` in `.env` / `.env.local`. */
export const PUBLIC_URL = (
	import.meta.env.PUBLIC_URL || "http://localhost:3000"
).replace(/\/$/, "");

export function publicUrl(path = "/") {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${PUBLIC_URL}${normalized}`;
}
