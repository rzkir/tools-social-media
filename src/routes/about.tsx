import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Cara pakai</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Hapus repost (Script Browser)
        </h1>
        <ol className="m-0 max-w-3xl list-decimal space-y-3 pl-5 text-base leading-7 text-[var(--sea-ink-soft)]">
          <li>
            Di Home, pilih <strong>Script Browser</strong>, isi username.
          </li>
          <li>
            Klik <strong>Buka TikTok</strong> — login di browser, buka profilmu.
          </li>
          <li>
            Klik <strong>Salin Script</strong>, paste di Console (F12), Enter.
          </li>
          <li>Panel di pojok kanan akan list + hapus repost otomatis.</li>
        </ol>
        <p className="mt-6 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Mode Cookie dari server sering gagal karena TikTok memblokir request
          non-browser (respons kosong). Script Browser memakai session login di
          tab TikTok secara langsung.
        </p>
      </section>
    </main>
  )
}
