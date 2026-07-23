import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  EyeOff,
  HeartOff,
  Layers,
  LayoutDashboard,
  MessageSquareX,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: "Social Tools - Bersihkan Jejak Digital dalam 1 Klik",
      },
    ],
  }),
});

const FEATURES = [
  {
    icon: Repeat,
    tone: "indigo",
    title: "Auto-delete Repost",
    desc: "Temukan dan hapus semua repost lama Anda secara massal dalam hitungan detik tanpa perlu manual.",
  },
  {
    icon: HeartOff,
    tone: "purple",
    title: "Unlike Massal",
    desc: "Tarik kembali likes Anda dari post-post masa lalu yang tidak lagi sesuai dengan personal branding Anda saat ini.",
  },
  {
    icon: MessageSquareX,
    tone: "orange",
    title: "Bulk Comment Delete",
    desc: "Hapus ribuan komentar Anda di berbagai akun dengan filter kata kunci atau rentang waktu tertentu.",
  },
  {
    icon: CalendarClock,
    tone: "emerald",
    title: "Scheduled Cleanup",
    desc: "Jadwalkan pembersihan otomatis setiap minggu atau bulan untuk menjaga akun Anda tetap bersih selamanya.",
  },
  {
    icon: Layers,
    tone: "rose",
    title: "Multi-platform",
    desc: "Mendukung Instagram, TikTok, dan Facebook. Satu dashboard untuk semua kendali akun sosial media Anda.",
  },
  {
    icon: EyeOff,
    tone: "sky",
    title: "Stealth Mode",
    desc: "Proses pembersihan berjalan di latar belakang tanpa mengganggu penggunaan aplikasi sosial media Anda.",
  },
] as const;

const STEPS = [
  {
    n: 1,
    color: "bg-indigo-600 shadow-indigo-100",
    title: "Hubungkan Akun",
    desc: "Login aman ke akun Instagram, TikTok, atau Facebook Anda melalui portal kami.",
  },
  {
    n: 2,
    color: "bg-purple-600 shadow-purple-100",
    title: "Scan Jejak Digital",
    desc: "Social Tools akan memindai riwayat aktivitas Anda dari ribuan post masa lalu.",
  },
  {
    n: 3,
    color: "bg-orange-500 shadow-orange-100",
    title: "Bersihkan Instan",
    desc: "Pilih apa yang ingin dihapus, klik satu tombol, dan biarkan Social Tools bekerja.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      '"Saya sangat terbantu menghapus repost-repost alay masa SMA sebelum melamar kerja. Dashboard-nya sangat mudah digunakan!"',
    name: "Adit Pratama",
    role: "Freelance Designer",
    seed: "Bagas",
    variant: "light" as const,
  },
  {
    quote:
      '"Ternyata ada ribuan jejak likes di post aneh yang saya sendiri sudah lupa. Social Tools membersihkannya hanya dalam satu malam."',
    name: "Dian Safitri",
    role: "Public Relations",
    seed: "Siska",
    variant: "indigo" as const,
  },
];

const PLANS = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "/sekali",
    desc: "Coba fitur dasar pembersihan akun Anda.",
    featured: false,
    cta: "Coba Sekarang",
    features: [
      { ok: true, text: "Hapus 100 Likes" },
      { ok: true, text: "Scan 1 Akun" },
      { ok: false, text: "Auto-cleanup Terjadwal" },
      { ok: false, text: "Support Prioritas" },
    ],
  },
  {
    name: "Basic",
    price: "Rp 49k",
    period: "/bulan",
    desc: "Pembersihan total untuk akun personal.",
    featured: true,
    cta: "Beli Paket Basic",
    features: [
      { ok: true, text: "Hapus Repost & Likes Tak Terbatas" },
      { ok: true, text: "Support 3 Akun" },
      { ok: true, text: "Filter Kata Kunci Komen" },
      { ok: true, text: "Email Support 24h" },
    ],
  },
  {
    name: "Pro",
    price: "Rp 99k",
    period: "/bulan",
    desc: "Kendali penuh & otomatisasi terjadwal.",
    featured: false,
    cta: "Pilih Paket Pro",
    features: [
      { ok: true, text: "Hapus Segala Jejak Digital" },
      { ok: true, text: "Support Unlimited Akun" },
      { ok: true, text: "Auto-cleanup Mingguan" },
      { ok: true, text: "Prioritas Support" },
    ],
  },
] as const;

const FAQS = [
  {
    q: "Apakah aman memberikan akses login?",
    a: "Social Tools menggunakan enkripsi 256-bit dan tidak menyimpan password Anda. Kami menggunakan API resmi platform untuk melakukan pembersihan.",
  },
  {
    q: "Apakah teman saya akan tahu jika saya menghapus jejak?",
    a: "Tidak sama sekali. Proses pembersihan berjalan secara natural dan tidak memberikan notifikasi apapun kepada pengikut atau pemilik akun lain.",
  },
  {
    q: "Bagaimana jika proses gagal di tengah jalan?",
    a: "Sistem kami memiliki fitur auto-retry. Jika koneksi terputus, Social Tools akan melanjutkan tugasnya secara otomatis saat sistem kembali stabil.",
  },
] as const;

const FEATURE_TONE: Record<
  (typeof FEATURES)[number]["tone"],
  { icon: string; hover: string }
> = {
  indigo: {
    icon: "text-indigo-600 group-hover:bg-indigo-600",
    hover: "group-hover:text-white",
  },
  purple: {
    icon: "text-purple-600 group-hover:bg-purple-600",
    hover: "group-hover:text-white",
  },
  orange: {
    icon: "text-orange-600 group-hover:bg-orange-600",
    hover: "group-hover:text-white",
  },
  emerald: {
    icon: "text-emerald-600 group-hover:bg-emerald-600",
    hover: "group-hover:text-white",
  },
  rose: {
    icon: "text-rose-600 group-hover:bg-rose-600",
    hover: "group-hover:text-white",
  },
  sky: {
    icon: "text-sky-600 group-hover:bg-sky-600",
    hover: "group-hover:text-white",
  },
};

const CHART_POINTS = [
  { x: 40, y: 118 },
  { x: 95, y: 102 },
  { x: 150, y: 88 },
  { x: 205, y: 95 },
  { x: 260, y: 72 },
  { x: 315, y: 58 },
  { x: 370, y: 48 },
  { x: 425, y: 36 },
] as const;

const CHART_PATH = CHART_POINTS.map((p, i) =>
  `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
).join(" ");

const SIDEBAR_LINKS = [
  { section: "Operations", items: ["TikTok", "Instagram", "Jobs"] },
  { section: "Workspace", items: ["Accounts", "Analytics"] },
] as const;

const METRIC_CARDS = [
  { label: "3 Active Jobs", value: "1,284" },
  { label: "Reposts Removed", value: "524" },
  { label: "Likes Cleared", value: "86%" },
  { label: "Comments Deleted", value: "312" },
  { label: "Connected Accounts", value: "13" },
] as const;

const JOB_ROWS = [
  {
    id: "JOB-2041",
    platform: "TikTok",
    amount: "524 items",
    date: "Jul 22, 2026",
    status: "Running",
    tone: "green",
  },
  {
    id: "JOB-2038",
    platform: "Instagram",
    amount: "128 likes",
    date: "Jul 21, 2026",
    status: "Done",
    tone: "green",
  },
  {
    id: "JOB-2031",
    platform: "TikTok",
    amount: "89 comments",
    date: "Jul 18, 2026",
    status: "Queued",
    tone: "amber",
  },
] as const;

function HeroCockpitFrame() {
  return (
    <div className="flex min-h-[420px] bg-[#F4F4F5] text-left text-slate-800 md:min-h-[520px]">
      {/* Sidebar */}
      <aside className="hidden w-[210px] shrink-0 flex-col border-r border-black/5 bg-[#F7F7F8] p-3 md:flex">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2.5 py-2 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
            ST
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-xs font-semibold">Social Tools</p>
            <p className="m-0 truncate text-[10px] text-slate-400">Workspace</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-200/70 px-2.5 py-2 text-xs font-medium">
          <LayoutDashboard className="h-3.5 w-3.5" />
          Overview
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-black/5 bg-white px-2.5 py-2 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5" />
          Search
          <span className="ml-auto rounded border border-slate-200 px-1 text-[10px]">
            /
          </span>
        </div>

        <div className="space-y-4 text-[11px]">
          {SIDEBAR_LINKS.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                {group.section}
              </p>
              <ul className="m-0 list-none space-y-0.5 p-0">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg px-2.5 py-1.5 text-slate-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2 py-2">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Cedric"
            alt=""
            className="h-7 w-7 rounded-full bg-slate-100"
          />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[11px] font-semibold">You</p>
            <p className="m-0 truncate text-[10px] text-slate-400">Owner</p>
          </div>
          <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3">
          <p className="m-0 text-sm font-semibold">Overview</p>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/5 bg-white text-slate-500">
              <RefreshCw className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="grid flex-1 gap-3 p-3 md:grid-cols-[1.45fr_0.7fr] md:p-4">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold">Items Removed</p>
                <div className="flex gap-2">
                  <span className="rounded-lg border border-black/5 px-2 py-1 text-[10px] text-slate-500">
                    Last Week ▾
                  </span>
                  <span className="rounded-lg border border-black/5 px-2 py-1 text-[10px] text-slate-500">
                    Month ▾
                  </span>
                </div>
              </div>

              <div className="mb-1 flex flex-wrap items-end gap-2">
                <span className="text-3xl font-bold tracking-tight md:text-4xl">
                  12.4K
                </span>
                <span className="mb-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  ↑ 23%
                </span>
              </div>
              <p className="m-0 mb-4 text-xs text-slate-400">
                2,841 more than last month.
              </p>

              <svg
                viewBox="0 0 460 140"
                className="h-28 w-full md:h-36"
                aria-hidden
              >
                {[30, 60, 90, 120].map((y) => (
                  <line
                    key={y}
                    x1="20"
                    x2="440"
                    y1={y}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="3 4"
                  />
                ))}
                <path
                  d={CHART_PATH}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {CHART_POINTS.map((p) => (
                  <circle
                    key={`${p.x}-${p.y}`}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#111827"
                  />
                ))}
              </svg>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-slate-400">
                {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(
                  (m) => (
                    <span key={m}>{m}</span>
                  ),
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
              <div className="border-b border-black/5 px-4 py-3">
                <p className="m-0 text-sm font-semibold">Recent Jobs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="px-4 py-2 font-medium">Job</th>
                      <th className="px-4 py-2 font-medium">Platform</th>
                      <th className="px-4 py-2 font-medium">Removed</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {JOB_ROWS.map((row) => (
                      <tr key={row.id} className="border-t border-black/5">
                        <td className="px-4 py-2.5 font-medium">{row.id}</td>
                        <td className="px-4 py-2.5">{row.platform}</td>
                        <td className="px-4 py-2.5">{row.amount}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.date}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              row.tone === "green"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="hidden flex-col gap-2.5 md:flex">
            {METRIC_CARDS.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-black/5 bg-white px-3.5 py-3 shadow-sm"
              >
                <p className="m-0 text-[11px] text-slate-400">{card.label}</p>
                <p className="m-0 mt-1 text-lg font-semibold tracking-tight">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [testimonialOffset, setTestimonialOffset] = useState(0);

  const visibleTestimonials = [
    TESTIMONIALS[testimonialOffset % TESTIMONIALS.length],
    TESTIMONIALS[(testimonialOffset + 1) % TESTIMONIALS.length],
  ];

  return (
    <main className="min-h-screen bg-[#F7F7F4] selection:bg-slate-200 selection:text-slate-900">
      {/* Hero — Billow-style copy + floating cockpit frame */}
      <section
        id="hero"
        className="relative overflow-hidden px-5 pt-28 pb-10 md:px-8 md:pt-32 md:pb-16"
      >
        <div className="mx-auto flex w-full max-w-[52rem] flex-col items-center text-center">
          <p className="mb-7 text-[13px] font-medium text-slate-500 md:mb-9">
            Untuk Instagram, TikTok, dan Facebook
          </p>

          <h1 className="font-display text-[clamp(3.25rem,9.5vw,6.5rem)] leading-[0.98] font-normal tracking-[-0.02em] text-slate-900">
            <span className="block">Hapus jejak masa lalu,</span>
            <span className="block">bukan tebak-tebakan.</span>
          </h1>

          <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-slate-500 md:mt-8 md:text-base">
            Social Tools menghubungkan akun sosial media Anda, membersihkan
            Repost, Likes, dan Komentar, lalu menunjukkan apa yang benar-benar
            terhapus. Tanpa menebak.
          </p>

          <Link
            to="/dashboard"
            className="mt-9 rounded-full bg-[#1a1a1a] px-6 py-3 text-[13px] font-medium text-white no-underline transition-opacity hover:opacity-85 md:mt-10"
          >
            Mulai Bersih-Bersih
          </Link>

          <div className="mt-8 flex items-center gap-6 text-[13px] font-medium text-slate-500 md:mt-10">
            <a
              href="#features"
              className="no-underline underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
            >
              Siapa ini untuk
            </a>
            <a
              href="#how-it-works"
              className="no-underline underline-offset-4 transition-colors hover:text-slate-900 hover:underline"
            >
              Cara mulai
            </a>
          </div>
        </div>

        {/* Floating app frame (Billow cockpit style) */}
        <div className="relative mx-auto mt-16 max-w-[1100px] md:mt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-8%] top-[-12%] bottom-[-20%] -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(186,210,240,0.55),transparent_70%)]"
          />
          <div className="overflow-hidden rounded-[1.35rem] border border-black/5 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-black/5">
            <HeroCockpitFrame />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 space-y-4 text-center">
            <p className="text-xs font-black tracking-[0.3em] text-indigo-600 uppercase">
              Fitur Utama
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-800 md:text-5xl">
              Kendali Penuh Atas Jejak Digital Anda
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const tone = FEATURE_TONE[feature.tone];
              return (
                <div
                  key={feature.title}
                  className="group rounded-[2.5rem] border border-transparent bg-slate-50 p-8 transition-all hover:border-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  <div
                    className={cn(
                      "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm transition-all group-hover:text-white",
                      tone.icon,
                    )}
                  >
                    <Icon className={cn("h-8 w-8", tone.hover)} />
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-slate-800">
                    {feature.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed font-medium text-slate-500">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[#F8F9FD] px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 space-y-4 text-center">
            <p className="text-xs font-black tracking-[0.3em] text-indigo-600 uppercase">
              Cara Kerja
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-800 md:text-5xl">
              Hanya 3 Langkah Mudah
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="relative flex flex-col items-center space-y-6 text-center"
              >
                <div
                  className={cn(
                    "relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-black text-white shadow-xl",
                    step.color,
                  )}
                >
                  {step.n}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-800">
                  {step.title}
                </h3>
                <p className="m-0 font-medium text-slate-500">{step.desc}</p>
                {i < STEPS.length - 1 ? (
                  <div className="absolute top-10 left-[70%] -z-0 hidden h-0.5 w-full border-t-2 border-dashed border-indigo-100 md:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="overflow-hidden bg-white px-4 py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <UserCheck className="h-8 w-8" aria-hidden />
              </div>
              <h2 className="text-5xl leading-tight font-black tracking-tighter text-slate-800">
                Kembalikan Reputasi Digital Anda
              </h2>
              <p className="text-lg leading-relaxed font-medium text-slate-500">
                Ribuan orang telah membersihkan masa lalu digital mereka untuk
                mendapatkan pekerjaan impian atau menjaga privasi personal.
              </p>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() =>
                    setTestimonialOffset(
                      (v) =>
                        (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
                    )
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-100 text-slate-400 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() =>
                    setTestimonialOffset((v) => (v + 1) % TESTIMONIALS.length)
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:col-span-3">
              {visibleTestimonials.map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className={cn(
                    "relative space-y-6 rounded-[2.5rem] p-8",
                    t.variant === "indigo"
                      ? "bg-indigo-600 text-white md:mt-12"
                      : "bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-1",
                      t.variant === "indigo"
                        ? "text-orange-300"
                        : "text-orange-400",
                    )}
                  >
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        className="h-4 w-4 fill-current"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <p
                    className={cn(
                      "font-medium italic",
                      t.variant === "indigo" ? "opacity-90" : "text-slate-700",
                    )}
                  >
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}`}
                      alt=""
                      className={cn(
                        "h-12 w-12 rounded-xl",
                        t.variant === "indigo"
                          ? "bg-white/20"
                          : "bg-indigo-100",
                      )}
                    />
                    <div className="text-sm">
                      <p
                        className={cn(
                          "m-0 font-black",
                          t.variant === "light" && "text-slate-800",
                        )}
                      >
                        {t.name}
                      </p>
                      <p
                        className={cn(
                          "m-0 text-[10px] font-bold tracking-widest uppercase",
                          t.variant === "indigo"
                            ? "opacity-70"
                            : "text-slate-400",
                        )}
                      >
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#F8F9FD] px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 space-y-4 text-center">
            <p className="text-xs font-black tracking-[0.3em] text-indigo-600 uppercase">
              Pilihan Paket
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-800 md:text-5xl">
              Harga Transparan Tanpa Biaya Tersembunyi
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative space-y-10 rounded-[2.5rem] p-10 transition-all",
                  plan.featured
                    ? "z-10 bg-indigo-600 text-white shadow-2xl shadow-indigo-200 lg:scale-105"
                    : "border border-slate-100 bg-white hover:shadow-2xl",
                )}
              >
                {plan.featured ? (
                  <div className="absolute top-6 right-6 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                    Best Seller
                  </div>
                ) : null}

                <div className="space-y-4">
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      plan.featured ? "opacity-80" : "text-slate-500",
                    )}
                  >
                    {plan.desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-4xl font-black",
                      !plan.featured && "text-slate-800",
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      plan.featured ? "opacity-70" : "text-slate-400",
                    )}
                  >
                    {plan.period}
                  </span>
                </div>

                <ul className="m-0 list-none space-y-4 p-0 pt-4">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className={cn(
                        "flex items-center gap-3 text-sm font-bold",
                        !plan.featured &&
                          (f.ok ? "text-slate-600" : "text-slate-400"),
                      )}
                    >
                      {f.ok ? (
                        <CheckCircle2
                          className={cn(
                            "h-5 w-5 shrink-0",
                            plan.featured ? "text-white" : "text-emerald-500",
                          )}
                        />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-slate-200" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/dashboard"
                  className={cn(
                    "block rounded-2xl py-4 text-center text-sm font-black no-underline transition-all",
                    plan.featured
                      ? "bg-white text-indigo-600 shadow-xl shadow-indigo-800/20 hover:bg-indigo-50"
                      : "border-2 border-slate-100 text-slate-800 hover:bg-slate-50",
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-4 py-32">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-800">
              Masih Ragu?
            </h2>
            <p className="font-medium text-slate-500">
              Pertanyaan yang paling sering ditanyakan pengguna.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 transition-all"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-6 text-left focus:outline-none"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    <span className="font-black tracking-tight text-slate-800">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-indigo-600 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="px-6 pb-6 text-sm leading-relaxed font-medium text-slate-500">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <div className="landing-hero-gradient relative overflow-hidden rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-indigo-300 md:p-20">
            <div className="relative z-10 space-y-10">
              <h2 className="mx-auto max-w-4xl text-4xl leading-tight font-black tracking-tighter md:text-6xl">
                Siap Membersihkan Masa Lalu Digital Anda?
              </h2>
              <p className="mx-auto max-w-2xl text-lg font-medium text-indigo-100 opacity-80">
                Jangan biarkan satu repost atau like lama merusak masa depan
                karir dan privasi Anda.
              </p>
              <div className="flex flex-wrap justify-center gap-6 pt-4">
                <Link
                  to="/dashboard"
                  className="rounded-3xl bg-white px-10 py-5 text-xl font-black text-indigo-600 no-underline shadow-2xl transition-all hover:scale-105"
                >
                  Bersihkan Akun Saya Sekarang
                </Link>
              </div>
            </div>
            <div className="landing-floating pointer-events-none absolute top-0 right-0 p-20 opacity-20">
              <Sparkles className="h-[200px] w-[200px] md:h-[300px] md:w-[300px]" />
            </div>
            <div
              className="landing-floating pointer-events-none absolute bottom-0 left-0 p-20 opacity-20"
              style={{ animationDelay: "-2s" }}
            >
              <ShieldCheck className="h-[180px] w-[180px] md:h-[250px] md:w-[250px]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
