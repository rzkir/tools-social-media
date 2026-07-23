import { Link } from "@tanstack/react-router";
import { Facebook, Globe, Instagram, ShieldCheck, Twitter } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "/#features", label: "Fitur Lengkap", external: true },
  { href: "/#faq", label: "Keamanan & Privasi", external: true },
  { href: "/docs", label: "API Dokumentasi", external: false },
  { href: "/docs", label: "Update Versi", external: false },
] as const;

const SUPPORT_LINKS = [
  { to: "/docs", label: "Pusat Bantuan" },
  { to: "/docs", label: "Syarat Layanan" },
  { to: "/docs", label: "Kebijakan Data" },
  { to: "/docs", label: "Report Bug" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="rounded-t-[3rem] bg-slate-900 px-4 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </div>
            <span className="text-2xl font-black tracking-tighter">
              Social Tools
            </span>
          </div>
          <p className="text-sm leading-relaxed font-medium text-slate-400">
            Solusi pembersihan jejak digital cerdas untuk Instagram, TikTok, dan
            Facebook. Melindungi reputasi digital Anda dengan sekali klik.
          </p>
          <div className="flex gap-4">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-800 no-underline transition-all hover:bg-indigo-600 hover:text-white"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-8 text-lg font-black tracking-tight">Produk</h4>
          <ul className="m-0 list-none space-y-4 p-0">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                {link.external ? (
                  <a
                    href={link.href}
                    className="text-sm font-bold text-slate-400 no-underline transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    className="text-sm font-bold text-slate-400 no-underline transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-8 text-lg font-black tracking-tight">Bantuan</h4>
          <ul className="m-0 list-none space-y-4 p-0">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-sm font-bold text-slate-400 no-underline transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-8 text-lg font-black tracking-tight">
            Hubungi Kami
          </h4>
          <p className="mb-4 text-sm font-bold text-slate-400">
            Jakarta Selatan, Indonesia
          </p>
          <p className="mb-4 text-sm font-bold text-slate-400">
						privacy@socialtools.com
          </p>
          <p className="text-sm font-bold text-slate-400">+62 812-3456-7890</p>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/5 pt-16 md:flex-row">
        <p className="m-0 text-xs font-bold tracking-widest text-slate-500 uppercase">
					© {year} Social Tools. All rights reserved.
        </p>
        <div className="flex gap-8">
          <a
            href="#"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 no-underline hover:text-white"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden />
            Bahasa Indonesia
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 no-underline hover:text-white"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System Status
          </a>
        </div>
      </div>
    </footer>
  );
}
