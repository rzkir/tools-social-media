import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

export type AvatarProps = {
	src?: string | null;
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
	alt = "",
	fallback,
	size = "md",
	className,
}: AvatarProps) {
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		setFailed(false);
	}, [src]);

	const showImage = Boolean(src) && !failed;

	return (
		<div
			className={cn(
				"relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 font-bold text-slate-500",
				sizeClass[size],
				className,
			)}
		>
			{showImage ? (
				<img
					src={src!}
					alt={alt}
					referrerPolicy="no-referrer"
					className="h-full w-full object-cover"
					onError={() => setFailed(true)}
				/>
			) : (
				<span aria-hidden>{initials(fallback)}</span>
			)}
		</div>
	);
}
