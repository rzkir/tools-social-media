import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "#/lib/utils";

const NAV_LINKS = [
	{ href: "/#features", label: "Fitur" },
	{ href: "/#how-it-works", label: "Cara Kerja" },
	{ href: "/#pricing", label: "Harga" },
	{ href: "/#faq", label: "FAQ" },
] as const;

export default function Header() {
	const [scrolled, setScrolled] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = pathname === "/";

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 50);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={cn(
				"fixed top-0 right-0 left-0 z-50 bg-transparent px-4 transition-[padding] duration-300 md:px-10",
				scrolled ? "py-3" : "py-5",
			)}
		>
			<div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-slate-200/80 bg-white px-5 py-3 shadow-sm md:px-6">
				<Link
					to="/"
					className="font-display text-xl tracking-tight text-[#111111] no-underline hover:text-[#111111] md:text-2xl"
				>
					Social Tools
				</Link>

				<nav className="hidden items-center gap-8 md:flex">
					{NAV_LINKS.map((link) => (
						<a
							key={link.href}
							href={isHome ? link.href.replace("/#", "#") : link.href}
							className="text-sm font-medium text-[#525252] no-underline transition-colors hover:text-[#111111]"
						>
							{link.label}
						</a>
					))}
				</nav>

				<Link
					to="/dashboard"
					className="rounded-full bg-[#111111] px-4 py-2 text-sm font-medium text-white no-underline hover:bg-[#222222] hover:text-white md:px-5 md:py-2.5"
				>
					Mulai Bersih-Bersih
				</Link>
			</div>
		</header>
	);
}
