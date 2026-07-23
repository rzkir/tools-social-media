import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-xs font-bold tracking-widest text-indigo-600 uppercase">
          Cara pakai
        </p>
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Hapus repost (Script Browser)
        </h1>
        <ol className="m-0 max-w-3xl list-decimal space-y-3 pl-5 text-base leading-7 text-slate-400">
          <li>
            Buka{" "}
            <strong className="text-slate-800">Dashboard → TikTok Tool</strong>,
            pilih <strong className="text-slate-800">Script Browser</strong>,
            isi username.
          </li>
          <li>
            Klik <strong className="text-slate-800">Buka TikTok</strong> — login
            di browser, buka profilmu.
          </li>
          <li>
            F12 → Console. Kalau Chrome menampilkan warning paste, ketik{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800">
              allow pasting
            </code>{" "}
            lalu Enter.
          </li>
          <li>
            Klik <strong className="text-slate-800">Salin Script</strong>, paste
            di Console, Enter.
          </li>
          <li>Panel di pojok kanan akan list + hapus repost otomatis.</li>
        </ol>
        <p className="mt-6 max-w-3xl text-sm text-slate-400">
          Mode Cookie dari server sering gagal karena TikTok memblokir request
          non-browser (respons kosong). Script Browser memakai session login di
          tab TikTok secara langsung.
        </p>
      </section>
    </main>
  );
}
