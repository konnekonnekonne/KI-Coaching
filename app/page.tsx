import Link from 'next/link'
import Image from 'next/image'
import { Logo, Button, Badge } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size={28} subline="Forschungsprototyp" />
          <Link href="/login">
            <Button variant="secondary" size="sm">Zur Plattform</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">

          <Badge variant="green" className="mb-6">
            Abschlussarbeit · INA CCW · 2026
          </Badge>

          <h1 className="heading-1 max-w-2xl mx-auto mb-5">
            Kann KI systemisches Coaching{' '}
            <em className="not-italic text-primary">sinnvoll unterstützen?</em>
          </h1>

          <p className="body-text text-muted max-w-xl mx-auto mb-10">
            KICO ist ein Forschungsprototyp, der untersucht, wo KI in der Coaching-Begleitung
            einen Mehrwert bieten kann — und wo ihre Grenzen liegen.
            Entwickelt als Abschlussarbeit an der INA CCW Coaching Akademie Berlin.
          </p>

          <Link href="/login">
            <Button variant="cta" size="lg">Zur Plattform →</Button>
          </Link>
        </section>

        {/* ── Forschungskontext ── */}
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10">

            <p className="caption text-muted uppercase tracking-widest mb-6">Forschungsprojekt</p>

            <div className="flex flex-col sm:flex-row sm:items-start gap-8">

              <div className="flex-1">
                <h2 className="heading-3 mb-3">Henrike Thomsen & Konstantin Escher</h2>
                <p className="body-text text-muted leading-relaxed">
                  Diese Plattform entstand im Rahmen einer Abschlussarbeit
                  im systemischen Business Coaching. Sie untersucht, ob und wie
                  ein KI-basiertes System methodisch sauber im Rahmen des INA&nbsp;CCW-Curriculums
                  arbeiten kann — und wo technische Möglichkeiten an ihre Grenzen stoßen.
                </p>
                <p className="body-text text-muted leading-relaxed mt-3">
                  Die Plattform ist kein kommerzielles Produkt. Sie dient ausschließlich
                  Forschungszwecken und richtet sich an einen geschlossenen Teilnehmerkreis.
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-center gap-3 sm:items-end">
                <p className="caption text-muted">In Zusammenarbeit mit</p>
                <a
                  href="https://inaccw.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Image
                    src="https://inaccw.org/wp-content/uploads/2021/08/logo.svg"
                    alt="INA CCW Coaching Akademie Berlin"
                    width={160}
                    height={42}
                    unoptimized
                  />
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ── Was KICO tut ── */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-surface border border-border rounded-xl p-6">
              <p className="text-2xl mb-3">🧭</p>
              <h3 className="heading-3 mb-2">Methodisch fundiert</h3>
              <p className="caption text-muted leading-relaxed">
                KICO arbeitet ausschließlich mit Werkzeugen aus dem INA&nbsp;CCW-Curriculum —
                U-Modell, systemische Fragen, Auftragsklärung.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <p className="text-2xl mb-3">🎙</p>
              <h3 className="heading-3 mb-2">Text & Sprache</h3>
              <p className="caption text-muted leading-relaxed">
                Coaching per Texteingabe oder als gesprochenes Gespräch —
                beides mit demselben methodischen Rahmen.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <p className="text-2xl mb-3">🔍</p>
              <h3 className="heading-3 mb-2">Grenzen sichtbar machen</h3>
              <p className="caption text-muted leading-relaxed">
                Ein zentrales Forschungsziel: zu verstehen, was KI im Coaching
                (noch) nicht kann — und warum.
              </p>
            </div>

          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="border-t border-border">
          <div className="max-w-3xl mx-auto px-6 py-8 text-center">
            <p className="caption text-muted">
              KICO ersetzt keine Psychotherapie oder professionelle Beratung.{' '}
              <br />
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
