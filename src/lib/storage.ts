/**
 * Thin localStorage helpers (SSR-safe).
 */

export function canUseLocalStorage(): boolean {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function storageGetRaw(key: string): string | null {
	if (!canUseLocalStorage()) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function storageSetRaw(key: string, value: string): boolean {
	if (!canUseLocalStorage()) return false;
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

export function storageRemove(key: string): void {
	if (!canUseLocalStorage()) return;
	try {
		localStorage.removeItem(key);
	} catch {
		// ignore quota / private mode
	}
}

export function storageGetJson<T>(key: string, fallback: T): T {
	const raw = storageGetRaw(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function storageSetJson(key: string, value: unknown): boolean {
	try {
		return storageSetRaw(key, JSON.stringify(value));
	} catch {
		return false;
	}
}
