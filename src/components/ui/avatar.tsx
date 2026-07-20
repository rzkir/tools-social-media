import { useEffect, useState } from "react";
import { normalizeTikTokAvatarUrl } from "#/lib/tiktok-avatar";
import { cn } from "#/lib/utils";

export type AvatarProps = {
	src?: string | null;
	/** Tried when primary src is missing or fails to load */
	fallbackSrc?: string | null;
	alt?: string;
	fallback?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
};

const sizeClass = {
	sm: "h-8 w-8 text-xs",
	md: "h-12 w-12 text-sm",
	lg: "h-16 w-16 text-base",
} as const;

function initials(fallback?: string) {
	const raw = (fallback || "?").trim();
	if (!raw) return "?";
	const parts = raw
		.replace(/^@/, "")
		.split(/[\s._-]+/)
		.filter(Boolean);
	if (parts.length >= 2) {
		return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
	}
	return raw.slice(0, 2).toUpperCase();
}

export function Avatar({
	src,
	fallbackSrc,
	alt = "",
	fallback,
	size = "md",
	className,
}: AvatarProps) {
	const primary =
		normalizeTikTokAvatarUrl(src) ?? (src?.trim() || undefined);
	const secondary =
		normalizeTikTokAvatarUrl(fallbackSrc) ??
		(fallbackSrc?.trim() || undefined);

	const [stage, setStage] = useState<"primary" | "fallback" | "initials">(
		primary ? "primary" : secondary ? "fallback" : "initials",
	);
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		setStage(primary ? "primary" : secondary ? "fallback" : "initials");
		setImageLoaded(false);
	}, [primary, secondary]);

	const imageSrc =
		stage === "primary" ? primary : stage === "fallback" ? secondary : undefined;
	const showInitials = !imageSrc || !imageLoaded;

	return (
		<div
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 font-bold text-slate-500",
				sizeClass[size],
				className,
			)}
		>
			<span
				className={cn(
					"absolute inset-0 flex items-center justify-center",
					!showInitials && "opacity-0",
				)}
				aria-hidden={!showInitials}
			>
				{initials(fallback)}
			</span>
			{imageSrc ? (
				<img
					src={imageSrc}
					alt={alt}
					referrerPolicy="no-referrer"
					className={cn(
						"relative z-[1] h-full w-full object-cover",
						!imageLoaded && "opacity-0",
					)}
					onLoad={() => setImageLoaded(true)}
					onError={() => {
						setImageLoaded(false);
						if (stage === "primary" && secondary && secondary !== primary) {
							setStage("fallback");
						} else {
							setStage("initials");
						}
					}}
				/>
			) : null}
		</div>
	);
}
