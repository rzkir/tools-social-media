import { useEffect, useState } from "react";

/** Live elapsed ms from startedAt → now (or endedAt when finished). */
export function useElapsedMs(
	startedAt: number | null | undefined,
	endedAt: number | null | undefined,
	running: boolean,
	active: boolean,
): number {
	const [fallbackStart, setFallbackStart] = useState<number | null>(null);
	const [now, setNow] = useState(() => Date.now());

	// Client fallback when extension state omits startedAt (e.g. stale build)
	useEffect(() => {
		if (!active) {
			setFallbackStart(null);
			return;
		}
		if (startedAt) {
			setFallbackStart(null);
			return;
		}
		if (running) {
			setFallbackStart((prev) => prev ?? Date.now());
		}
	}, [active, startedAt, running]);

	const start = startedAt ?? fallbackStart;

	useEffect(() => {
		if (!active || !start || !running) return;
		setNow(Date.now());
		const id = window.setInterval(() => setNow(Date.now()), 250);
		return () => window.clearInterval(id);
	}, [active, start, running]);

	if (!start) return 0;
	const end = !running ? (endedAt ?? now) : now;
	return Math.max(0, end - start);
}
