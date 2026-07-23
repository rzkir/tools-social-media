import { Cloud, GraduationCap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "#/lib/utils";

const STATUSES = [
	{
		main: "Buckle up!",
		sub: "Our learning engines are warming up for your big adventure.",
		pct: 0,
	},
	{
		main: "Charging...",
		sub: "Collecting the best lessons for you!",
		pct: 35,
	},
	{
		main: "Almost there!",
		sub: "Final navigation check in progress.",
		pct: 75,
	},
	{
		main: "Liftoff!",
		sub: "Prepare for learning in 3, 2, 1...",
		pct: 100,
	},
] as const;

const CONFETTI_COLORS = [
	"#6366f1",
	"#a855f7",
	"#f97316",
	"#ec4899",
	"#3b82f6",
];

type ConfettiPiece = {
	id: number;
	left: string;
	color: string;
	delay: string;
	opacity: number;
};

export type LoadingScreenProps = {
	className?: string;
	brand?: string;
	captainName?: string;
	captainStatus?: string;
	/** Called once the progress sequence finishes (~4s). */
	onComplete?: () => void;
};

export default function LoadingScreen({
	className,
	brand = "Social Tools",
	captainName = "Captain Joy",
	captainStatus = "Redirecting now...",
	onComplete,
}: LoadingScreenProps) {
	const [step, setStep] = useState(0);
	const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

	const status = STATUSES[Math.min(step, STATUSES.length - 1)];

	const clouds = useMemo(
		() => [
			{ delay: "0s", size: "text-[100px]", top: "top-20", opacity: "text-white/40" },
			{ delay: "-5s", size: "text-[80px]", top: "top-60", opacity: "text-white/30" },
			{
				delay: "-12s",
				size: "text-[120px]",
				top: "bottom-40",
				opacity: "text-white/50",
			},
		],
		[],
	);

	useEffect(() => {
		const pieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
			id: i,
			left: `${Math.random() * 100}vw`,
			color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
			delay: `${Math.random() * 4}s`,
			opacity: Math.random(),
		}));
		setConfetti(pieces);
	}, []);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setStep((prev) => {
				if (prev >= STATUSES.length - 1) {
					window.clearInterval(interval);
					return prev;
				}
				return prev + 1;
			});
		}, 1000);

		return () => window.clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!onComplete) return;
		const timer = window.setTimeout(onComplete, 4000);
		return () => window.clearTimeout(timer);
	}, [onComplete]);

	return (
		<div
			className={cn(
				"loading-screen bg-playful relative flex min-h-screen flex-col items-center justify-center overflow-hidden",
				className,
			)}
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			{clouds.map((cloud) => (
				<div
					key={cloud.delay}
					className={cn(
						"cloud-move absolute left-[-200px]",
						cloud.top,
						cloud.size,
						cloud.opacity,
					)}
					style={{ animationDelay: cloud.delay }}
					aria-hidden
				>
					<Cloud className="h-[1em] w-[1em] fill-current" strokeWidth={0} />
				</div>
			))}

			<div className="pointer-events-none absolute inset-0" aria-hidden>
				{confetti.map((piece) => (
					<div
						key={piece.id}
						className="confetti"
						style={{
							left: piece.left,
							backgroundColor: piece.color,
							animationDelay: piece.delay,
							opacity: piece.opacity,
						}}
					/>
				))}
			</div>

			<div className="relative z-20 flex flex-col items-center">
				<div className="rocket-float relative mb-8">
					<div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-indigo-100 bg-white shadow-2xl">
						<span className="text-8xl leading-none" aria-hidden>
							🚀
						</span>
						<div className="exhaust absolute -bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center">
							<div className="h-20 w-8 rounded-full bg-gradient-to-t from-orange-400/0 via-orange-400 to-yellow-300 blur-sm" />
						</div>
					</div>

					<div
						className="bounce-text absolute -top-6 -right-6"
						style={{ animationDelay: "0.2s" }}
						aria-hidden
					>
						<span className="text-4xl">✨</span>
					</div>
					<div
						className="bounce-text absolute -bottom-4 -left-8"
						style={{ animationDelay: "0.5s" }}
						aria-hidden
					>
						<span className="text-3xl">⭐</span>
					</div>
				</div>

				<div className="space-y-4 px-6 text-center">
					<div className="mb-2 flex items-center justify-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
							<GraduationCap className="h-4 w-4" aria-hidden />
						</div>
						<span className="text-xl font-black tracking-tighter text-slate-800 uppercase">
							{brand}
						</span>
					</div>

					<h2 className="text-4xl font-black tracking-tight text-slate-800">
						{status.main}
					</h2>

					<div className="mx-auto max-w-xs">
						<p className="text-sm font-bold text-slate-500">{status.sub}</p>
					</div>
				</div>

				<div className="mt-12 w-80 max-w-[calc(100vw-2rem)]">
					<div className="relative h-6 rounded-full border border-white bg-slate-200/50 p-1.5 shadow-inner">
						<div className="loader-bar relative h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
							<div className="absolute top-1/2 right-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-500 bg-white shadow-md" />
						</div>
					</div>
					<div className="mt-3 flex justify-between px-1">
						<span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
							Mission Status
						</span>
						<span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">
							{status.pct}%
						</span>
					</div>
				</div>
			</div>

			<div className="absolute right-10 bottom-10 flex items-center gap-4 rounded-3xl border border-white bg-white/80 p-4 shadow-xl backdrop-blur-md">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
					<span className="text-3xl" aria-hidden>
						😎
					</span>
				</div>
				<div>
					<p className="text-xs font-black text-slate-800">{captainName}</p>
					<p className="text-[10px] font-bold text-slate-500">{captainStatus}</p>
				</div>
			</div>
		</div>
	);
}
