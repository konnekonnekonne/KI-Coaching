import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo / Wordmark */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-[--foreground]">
            kico
          </h1>
          <p className="text-lg text-[--muted]">KI-Coach · Systemisches Coaching</p>
        </div>

        {/* Value Prop */}
        <p className="text-xl text-[--foreground] leading-relaxed max-w-lg mx-auto">
          Reflexion und Veränderung — methodisch fundiert, jederzeit verfügbar.
          Basierend auf dem INA CCW-Curriculum (ECA-zertifiziert).
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[--accent] px-8 py-3 text-white font-medium hover:bg-[--accent-light] transition-colors"
          >
            Kostenlos starten
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-[--border] px-8 py-3 text-[--foreground] font-medium hover:bg-[--surface] transition-colors"
          >
            Anmelden
          </Link>
        </div>

        {/* Trust signals */}
        <p className="text-sm text-[--muted]">
          Kein Abonnement · Deine Daten bleiben deine Daten · Made in Germany
        </p>
      </div>
    </main>
  )
}
