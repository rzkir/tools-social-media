import {
	EMPTY_COOKIE_VALUES,
	type TikTokCookieValues,
} from "#/components/TikTokCookieForm";
import {
	EMPTY_INSTAGRAM_COOKIE_VALUES,
	type InstagramCookieValues,
} from "#/components/InstagramCookieForm";
import { normalizeTikTokAvatarUrl } from "#/lib/tiktok-avatar";
import { parseInstagramCookieString } from "#/services/instagram.services";
import type { TikTokUser } from "#/types/tiktok";

export type { TikTokCookieValues, InstagramCookieValues };

/** Legacy single-session key — migrated into ACCOUNTS_STORAGE_KEY */
const LEGACY_STORAGE_KEY = "tt_repost_cookie_session";
const ACCOUNTS_STORAGE_KEY = "rr_accounts_v2";

export type AccountPlatform = "tiktok" | "instagram";
export type AccountBridge = "cookie" | "browser";

export type TikTokStoredAccount = {
	id: string;
	platform: "tiktok";
	bridge: AccountBridge;
	cookies: TikTokCookieValues;
	user: TikTokUser | null;
	updatedAt: number;
};

export type InstagramStoredAccount = {
	id: string;
	platform: "instagram";
	bridge: AccountBridge;
	cookies: InstagramCookieValues;
	user: TikTokUser | null;
	updatedAt: number;
};

export type StoredAccount = TikTokStoredAccount | InstagramStoredAccount;

export type AccountsStore = {
	version: 2;
	accounts: StoredAccount[];
	/** Active account id per platform (tools use this). */
	activeIds: {
		tiktok: string | null;
		instagram: string | null;
	};
};

/** @deprecated Use StoredAccount — kept for gradual migration of call sites */
export type StoredCookieSession = StoredAccount;

function nextAccountId(platform: AccountPlatform): string {
	return `${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePlatform(value: unknown): AccountPlatform {
	return value === "instagram" ? "instagram" : "tiktok";
}

function parseBridge(value: unknown): AccountBridge {
	return value === "browser" ? "browser" : "cookie";
}

function parseUser(value: unknown): TikTokUser | null {
	if (!value || typeof value !== "object") return null;
	const u = value as Record<string, unknown>;
	if (typeof u.uniqueId !== "string" || !u.uniqueId.trim()) return null;
	return {
		uniqueId: u.uniqueId.trim().replace(/^@/, ""),
		secUid: typeof u.secUid === "string" ? u.secUid : "",
		nickname:
			typeof u.nickname === "string" && u.nickname.trim()
				? u.nickname
				: u.uniqueId.trim().replace(/^@/, ""),
		avatarUrl: normalizeTikTokAvatarUrl(u.avatarUrl),
	};
}

export function parseTikTokCookies(value: unknown): TikTokCookieValues {
	if (!value || typeof value !== "object") return { ...EMPTY_COOKIE_VALUES };
	const v = value as Record<string, unknown>;
	return {
		...EMPTY_COOKIE_VALUES,
		sessionid: typeof v.sessionid === "string" ? v.sessionid : "",
		tt_csrf_token: typeof v.tt_csrf_token === "string" ? v.tt_csrf_token : "",
		msToken: typeof v.msToken === "string" ? v.msToken : "",
		s_v_web_id: typeof v.s_v_web_id === "string" ? v.s_v_web_id : "",
		ttwid: typeof v.ttwid === "string" ? v.ttwid : "",
		username: typeof v.username === "string" ? v.username.replace(/^@/, "") : "",
		secUid: typeof v.secUid === "string" ? v.secUid : "",
		avatarUrl: typeof v.avatarUrl === "string" ? v.avatarUrl : "",
	};
}

export function parseInstagramCookies(value: unknown): InstagramCookieValues {
	if (!value || typeof value !== "object") {
		return { ...EMPTY_INSTAGRAM_COOKIE_VALUES };
	}
	const v = value as Record<string, unknown>;
	let sessionid = typeof v.sessionid === "string" ? v.sessionid : "";

	if (sessionid.includes(";") && sessionid.includes("=")) {
		const parsed = parseInstagramCookieString(sessionid);
		return {
			...EMPTY_INSTAGRAM_COOKIE_VALUES,
			...parsed,
			username:
				typeof v.username === "string"
					? v.username.replace(/^@/, "")
					: parsed?.username || "",
			avatarUrl: typeof v.avatarUrl === "string" ? v.avatarUrl : "",
		};
	}

	return {
		...EMPTY_INSTAGRAM_COOKIE_VALUES,
		sessionid,
		ds_user_id: typeof v.ds_user_id === "string" ? v.ds_user_id : "",
		csrftoken: typeof v.csrftoken === "string" ? v.csrftoken : "",
		mid: typeof v.mid === "string" ? v.mid : "",
		ig_did: typeof v.ig_did === "string" ? v.ig_did : "",
		datr: typeof v.datr === "string" ? v.datr : "",
		username: typeof v.username === "string" ? v.username.replace(/^@/, "") : "",
		avatarUrl: typeof v.avatarUrl === "string" ? v.avatarUrl : "",
	};
}

export function isTikTokAccount(
	account: StoredAccount,
): account is TikTokStoredAccount {
	return account.platform === "tiktok";
}

export function isInstagramAccount(
	account: StoredAccount,
): account is InstagramStoredAccount {
	return account.platform === "instagram";
}

/** @deprecated Use isInstagramAccount */
export function isInstagramCookies(
	cookies: TikTokCookieValues | InstagramCookieValues,
): cookies is InstagramCookieValues {
	return "ds_user_id" in cookies || "csrftoken" in cookies;
}

function emptyStore(): AccountsStore {
	return {
		version: 2,
		accounts: [],
		activeIds: { tiktok: null, instagram: null },
	};
}

function accountUsername(account: StoredAccount): string {
	return (
		account.cookies.username?.trim() ||
		account.user?.uniqueId?.trim() ||
		""
	).replace(/^@/, "");
}

function hydrateAccountFields(account: StoredAccount): StoredAccount | null {
	const username = accountUsername(account);
	if (!username && !account.user) return null;

	if (account.platform === "tiktok") {
		const cookies = { ...account.cookies };
		if (account.user?.uniqueId && !cookies.username) {
			cookies.username = account.user.uniqueId;
		}
		if (account.user?.secUid && !cookies.secUid) {
			cookies.secUid = account.user.secUid;
		}
		return { ...account, cookies };
	}

	const cookies = { ...account.cookies };
	if (account.user?.uniqueId && !cookies.username) {
		cookies.username = account.user.uniqueId;
	}
	if (account.user?.secUid && !cookies.ds_user_id) {
		cookies.ds_user_id = account.user.secUid;
	}
	return { ...account, cookies };
}

function parseLegacySession(raw: unknown): StoredAccount | null {
	if (!raw || typeof raw !== "object") return null;
	const parsed = raw as Record<string, unknown>;
	const platform = parsePlatform(parsed.platform);
	const bridge = parseBridge(parsed.bridge);
	const user = parseUser(parsed.user);
	const updatedAt =
		typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();
	const id =
		typeof parsed.id === "string" && parsed.id.trim()
			? parsed.id.trim()
			: nextAccountId(platform);

	if (platform === "instagram") {
		const cookies = parseInstagramCookies(parsed.cookies);
		const account: InstagramStoredAccount = {
			id,
			platform: "instagram",
			bridge,
			cookies,
			user,
			updatedAt,
		};
		return hydrateAccountFields(account);
	}

	const cookies = parseTikTokCookies(parsed.cookies);
	const account: TikTokStoredAccount = {
		id,
		platform: "tiktok",
		bridge,
		cookies,
		user,
		updatedAt,
	};
	return hydrateAccountFields(account);
}

function parseStoredAccount(raw: unknown): StoredAccount | null {
	if (!raw || typeof raw !== "object") return null;
	const parsed = raw as Record<string, unknown>;
	if (typeof parsed.id !== "string" || !parsed.id.trim()) {
		return parseLegacySession(raw);
	}
	return parseLegacySession(raw);
}

function persistStore(store: AccountsStore): AccountsStore {
	if (typeof sessionStorage === "undefined") return store;
	try {
		sessionStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(store));
		// Keep a legacy snapshot of active TikTok for older readers
		const activeTt = getActiveAccountFromStore(store, "tiktok");
		if (activeTt) {
			sessionStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(activeTt));
		} else {
			sessionStorage.removeItem(LEGACY_STORAGE_KEY);
		}
	} catch {
		// ignore quota / private mode
	}
	return store;
}

function ensureActiveIds(store: AccountsStore): AccountsStore {
	const next = { ...store, activeIds: { ...store.activeIds } };
	for (const platform of ["tiktok", "instagram"] as const) {
		const activeId = next.activeIds[platform];
		const stillThere =
			activeId &&
			next.accounts.some((a) => a.id === activeId && a.platform === platform);
		if (stillThere) continue;
		const first = next.accounts.find((a) => a.platform === platform);
		next.activeIds[platform] = first?.id ?? null;
	}
	return next;
}

function migrateLegacyIfNeeded(): AccountsStore | null {
	if (typeof sessionStorage === "undefined") return null;
	try {
		const legacyRaw = sessionStorage.getItem(LEGACY_STORAGE_KEY);
		if (!legacyRaw) return null;
		const account = parseLegacySession(JSON.parse(legacyRaw));
		if (!account) return null;
		const store: AccountsStore = {
			version: 2,
			accounts: [account],
			activeIds: {
				tiktok: account.platform === "tiktok" ? account.id : null,
				instagram: account.platform === "instagram" ? account.id : null,
			},
		};
		persistStore(store);
		return store;
	} catch {
		return null;
	}
}

export function loadAccountsStore(): AccountsStore {
	if (typeof sessionStorage === "undefined") return emptyStore();
	try {
		const raw = sessionStorage.getItem(ACCOUNTS_STORAGE_KEY);
		if (!raw) {
			return migrateLegacyIfNeeded() ?? emptyStore();
		}
		const parsed = JSON.parse(raw) as Partial<AccountsStore>;
		const accounts = Array.isArray(parsed.accounts)
			? parsed.accounts
					.map(parseStoredAccount)
					.filter((a): a is StoredAccount => Boolean(a))
			: [];

		const store = ensureActiveIds({
			version: 2,
			accounts,
			activeIds: {
				tiktok:
					typeof parsed.activeIds?.tiktok === "string"
						? parsed.activeIds.tiktok
						: null,
				instagram:
					typeof parsed.activeIds?.instagram === "string"
						? parsed.activeIds.instagram
						: null,
			},
		});
		return store;
	} catch {
		return emptyStore();
	}
}

function getActiveAccountFromStore(
	store: AccountsStore,
	platform: AccountPlatform,
): StoredAccount | null {
	const activeId = store.activeIds[platform];
	if (activeId) {
		const found = store.accounts.find(
			(a) => a.id === activeId && a.platform === platform,
		);
		if (found) return found;
	}
	return store.accounts.find((a) => a.platform === platform) ?? null;
}

export function listAccounts(
	platform?: AccountPlatform,
): StoredAccount[] {
	const store = loadAccountsStore();
	if (!platform) return store.accounts;
	return store.accounts.filter((a) => a.platform === platform);
}

export function getAccountById(id: string): StoredAccount | null {
	return loadAccountsStore().accounts.find((a) => a.id === id) ?? null;
}

export function getActiveAccount(
	platform: AccountPlatform,
): StoredAccount | null {
	return getActiveAccountFromStore(loadAccountsStore(), platform);
}

export function setActiveAccountId(
	platform: AccountPlatform,
	id: string | null,
): AccountsStore {
	const store = loadAccountsStore();
	if (id) {
		const account = store.accounts.find((a) => a.id === id);
		if (!account || account.platform !== platform) return store;
	}
	return persistStore(
		ensureActiveIds({
			...store,
			activeIds: { ...store.activeIds, [platform]: id },
		}),
	);
}

export type UpsertTikTokAccountInput = {
	id?: string;
	platform: "tiktok";
	cookies: TikTokCookieValues;
	user: TikTokUser | null;
	bridge?: AccountBridge;
	setActive?: boolean;
};

export type UpsertInstagramAccountInput = {
	id?: string;
	platform: "instagram";
	cookies: InstagramCookieValues;
	user: TikTokUser | null;
	bridge?: AccountBridge;
	setActive?: boolean;
};

export type UpsertAccountInput =
	| UpsertTikTokAccountInput
	| UpsertInstagramAccountInput;

/**
 * Insert or update an account. Same platform + username updates existing row.
 * TikTok and Instagram never overwrite each other.
 */
export function upsertAccount(input: UpsertAccountInput): StoredAccount {
	const store = loadAccountsStore();
	const username = (
		input.cookies.username?.trim() ||
		input.user?.uniqueId?.trim() ||
		""
	).replace(/^@/, "");

	let existing: StoredAccount | undefined;
	if (input.id) {
		existing = store.accounts.find(
			(a) => a.id === input.id && a.platform === input.platform,
		);
	}
	if (!existing && username) {
		existing = store.accounts.find(
			(a) =>
				a.platform === input.platform &&
				accountUsername(a).toLowerCase() === username.toLowerCase(),
		);
	}

	const id = existing?.id ?? input.id ?? nextAccountId(input.platform);
	const updatedAt = Date.now();
	const bridge = input.bridge ?? existing?.bridge ?? "cookie";

	let next: StoredAccount;
	if (input.platform === "tiktok") {
		next = {
			id,
			platform: "tiktok",
			bridge,
			cookies: parseTikTokCookies(input.cookies),
			user: input.user,
			updatedAt,
		};
	} else {
		next = {
			id,
			platform: "instagram",
			bridge,
			cookies: parseInstagramCookies(input.cookies),
			user: input.user,
			updatedAt,
		};
	}

	const hydrated = hydrateAccountFields(next) ?? next;
	const accounts = existing
		? store.accounts.map((a) => (a.id === id ? hydrated : a))
		: [...store.accounts, hydrated];

	const setActive = input.setActive !== false;
	const activeIds = { ...store.activeIds };
	if (setActive) {
		activeIds[input.platform] = id;
	}

	persistStore(ensureActiveIds({ version: 2, accounts, activeIds }));
	return hydrated;
}

export function removeAccount(id: string): AccountsStore {
	const store = loadAccountsStore();
	const accounts = store.accounts.filter((a) => a.id !== id);
	return persistStore(
		ensureActiveIds({
			...store,
			accounts,
		}),
	);
}

export function clearAllAccounts(): void {
	if (typeof sessionStorage === "undefined") return;
	try {
		sessionStorage.removeItem(ACCOUNTS_STORAGE_KEY);
		sessionStorage.removeItem(LEGACY_STORAGE_KEY);
	} catch {
		// ignore
	}
}

/** Active account for a platform (tools). */
export function loadCookieSession(
	platform: AccountPlatform = "tiktok",
): StoredAccount | null {
	return getActiveAccount(platform);
}

/**
 * @deprecated Prefer upsertAccount — writes only the matching platform slot.
 */
export function saveCookieSession(
	cookies: TikTokCookieValues | InstagramCookieValues,
	user: TikTokUser | null,
	meta?: {
		platform?: AccountPlatform;
		bridge?: AccountBridge;
		id?: string;
	},
): StoredAccount {
	const platform = meta?.platform ?? "tiktok";
	if (platform === "instagram") {
		return upsertAccount({
			id: meta?.id,
			platform: "instagram",
			cookies: parseInstagramCookies(cookies),
			user,
			bridge: meta?.bridge,
		});
	}
	return upsertAccount({
		id: meta?.id,
		platform: "tiktok",
		cookies: parseTikTokCookies(cookies),
		user,
		bridge: meta?.bridge,
	});
}

/** Clears all accounts (legacy API). Prefer removeAccount(id). */
export function clearCookieSession(): void {
	clearAllAccounts();
}

export function hasSavedAccount(
	session: StoredAccount | null | undefined,
): boolean {
	if (!session) return false;
	return Boolean(accountUsername(session));
}

export function bridgeLabel(
	platform: AccountPlatform,
	bridge: AccountBridge,
): string {
	if (platform === "instagram") {
		return bridge === "browser" ? "Script Instagram" : "Cookie Instagram";
	}
	return bridge === "browser" ? "Script Browser" : "Cookie TikTok";
}
