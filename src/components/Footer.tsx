export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-16 border-t border-slate-200 px-4 pt-8 pb-12 text-slate-400">
			<div className="page-wrap flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">
					&copy; {year} Remove Repost TikTok. Cookie di sessionStorage (tab).
				</p>
				<p className="m-0 text-xs font-bold tracking-widest text-indigo-600 uppercase">
					Gunakan dengan hati-hati
				</p>
			</div>
		</footer>
	);
}
