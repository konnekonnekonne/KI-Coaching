import Link from 'next/link'
import { Logo, Button, Badge } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={28} subline="Dein KI-Coach" />
          <Link href="/login">
            <Button variant="secondary" size="sm">Anmelden</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">

          <Badge variant="green" className="mb-6">
            ECA-zertifiziert · INA CCW-Curriculum
          </Badge>

          <h1 className="heading-1 max-w-2xl mx-auto mb-5">
            Coaching, das auf dich{' '}
            <em className="not-italic text-primary">wartet.</em>
          </h1>

          <p className="body-text text-muted max-w-lg mx-auto mb-10">
            Reflexion und Veränderung — methodisch fundiert, jederzeit verfügbar.
            Kein Termin. Kein Warten. Einfach anfangen.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button variant="cta" size="lg">Kostenlos starten →</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">Ich habe bereits ein Konto</Button>
            </Link>
          </div>
        </section>

        {/* ── Value Props ── */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="text-2xl mb-3">🌱</div>
              <h3 className="heading-3 mb-2">Methodisch</h3>
              <p className="caption text-muted leading-relaxed">
                Basierend auf dem INA CCW-Curriculum. Systemische Fragetechniken,
                U-Modell, Inneres Team — kein freies Improvisieren.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="text-2xl mb-3">🕐</div>
              <h3 className="heading-3 mb-2">Immer verfügbar</h3>
              <p className="caption text-muted leading-relaxed">
                Morgens vor der Arbeit, abends nach einem schwierigen Tag —
                KICO ist da, wenn du es brauchst.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="heading-3 mb-2">Deine Daten</h3>
              <p className="caption text-muted leading-relaxed">
                Deine Gespräche gehören nur dir. Keine Weitergabe,
                kein Training auf deinen Daten, kein Tracking.
              </p>
            </div>

          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="border-t border-border">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="caption">
              KICO ersetzt keine Psychotherapie oder professionelle Beratung.
              Bei psychischen Krisen wende dich an die Telefonseelsorge:{' '}
              <a href="tel:08001110111" className="text-primary hover:underline font-medium">
                0800 111 0 111
              </a>{' '}
              (kostenlos, 24/7)
            </p>
          </div>
        </section>
      </main>

    </div>
  )
}
