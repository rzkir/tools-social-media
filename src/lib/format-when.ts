/** Shared date formatter (id-ID). */
export function formatWhen(at: number) {
	try {
		return new Intl.DateTimeFormat("id-ID", {
			dateStyle: "medium",
			timeStyle: "short",
		}).format(new Date(at));
	} catch {
		return new Date(at).toLocaleString();
	}
}
